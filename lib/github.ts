import { Octokit } from "@octokit/rest";
import type { GeneratedBlog } from "./types";

/**
 * Push a generated blog post directly to the `main` branch on GitHub.
 * Vercel auto-deploys from main — NO human-in-the-loop.
 */

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return new Octokit({ auth: token });
}

function getRepoConfig() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!owner || !repo) throw new Error("GITHUB_OWNER and GITHUB_REPO must be set");
  return { owner, repo, branch };
}

/**
 * Push a blog post markdown file directly to main branch.
 * Vercel will auto-deploy on push.
 */
export async function pushBlogToMain(blog: GeneratedBlog): Promise<{
  commitUrl: string;
  filePath: string;
  branch: string;
}> {
  const octokit = getOctokit();
  const { owner, repo, branch } = getRepoConfig();

  // Get the current commit SHA of the target branch
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const latestCommitSha = refData.object.sha;

  // Get the tree SHA of the latest commit
  const { data: commitData } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // Create a blob for the new blog file
  const { data: blob } = await octokit.git.createBlob({
    owner,
    repo,
    content: Buffer.from(blog.markdownContent).toString("base64"),
    encoding: "base64",
  });

  // Create a new tree with the blog file
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: [
      {
        path: blog.filePath,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      },
    ],
  });

  // Create the commit
  const commitMessage = `📝 Auto-publish: ${blog.frontmatter.title}\n\nWeather mode: ${blog.frontmatter.weatherMode}\nWeek: ${blog.frontmatter.weatherWeek}\nCategory: ${blog.frontmatter.category}\n\nAutomated weather-triggered blog post — direct to main.`;

  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update the branch reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  const commitUrl = `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`;
  console.log(`✅ Blog pushed to ${branch}: ${commitUrl}`);

  return {
    commitUrl,
    filePath: blog.filePath,
    branch,
  };
}
