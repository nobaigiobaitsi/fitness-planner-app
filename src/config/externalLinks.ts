const githubPagesBaseUrl =
  "https://nobaigiobaitsi.github.io/fitplanner-app-legal";

export const externalLinks = {
  privacyPolicy: `${githubPagesBaseUrl}/privacy.html`,
  support: `${githubPagesBaseUrl}/support.html`,
} as const;

export function isConfiguredExternalLink(url: string) {
  return url.startsWith(`${githubPagesBaseUrl}/`);
}
