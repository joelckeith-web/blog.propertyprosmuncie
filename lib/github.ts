import { Octokit } from "@octokit/rest";
import type { GeneratedBlog } from "./types";

/**
 * Push a generated blog draft to the `dev` branch on GitHub.
 * Human reviews on `dev`, then merges to `main` to trigger Vercel deploy.
 */

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return new Octokit({ auth: token });
}

function getRepoConfig() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "dev";
  if (!owner || !repo) throw new Error("GITHUB_OWNER and GITHUB_REPO must be set");
  return { owner, repo, branch };
}

/**
 * Ensure the `dev` branch exists. If not, create it from `main`.
 */
async function ensureDevBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  try {
    // Try to get the dev branch
    const { data } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    return data.object.sha;
  } catch (error: unknown) {
    // Branch doesn't exist — create from main
    const { data: mainRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: "heads/main",
    });

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: mainRef.object.sha,
    });

    console.log(`Created branch '${branch}' from main at ${mainRef.object.sha}`);
    return mainRef.object.sha;
  }
}

/**
 * Push a blog post markdown file to the dev branch.
 */
export async function pushBlogToDev(blog: GeneratedBlog): Promise<{
  commitUrl: string;
  filePath: string;
  branch: string;
}> {
  const octokit = getOctokit();
  const { owner, repo, branch } = getRepoConfig();

  // Ensure dev branch exists
  await ensureDevBranch(octokit, owner, repo, branch);

  // Get the current commit SHA of the dev branch
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
  const commitMessage = `📝 New blog draft: ${blog.frontmatter.title}\n\nWeather-triggered: ${blog.frontmatter.weatherTriggered}\nWeek: ${blog.frontmatter.weatherWeek}\nCategory: ${blog.frontmatter.category}\n\nAuto-generated — review and merge to main to publish.`;

  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update the dev branch reference
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

/**
 * List pending blog drafts on the dev branch (not yet merged to main).
 */
export async function listPendingDrafts(): Promise<string[]> {
  const octokit = getOctokit();
  const { owner, repo, branch } = getRepoConfig();

  try {
    const { data } = await octokit.repos.compareCommits({
      owner,
      repo,
      base: "main",
      head: branch,
    });

    return data.files
      ?.filter((f) => f.filename.startsWith("content/posts/") && f.status === "added")
      .map((f) => f.filename) || [];
  } catch {
    return [];
  }
}
