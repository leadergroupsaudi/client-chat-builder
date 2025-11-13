interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Convert display mentions (@FirstName) to API format (@user:123)
 * Uses fuzzy matching to find the user by first name or email
 */
export const convertMentionsToApiFormat = (content: string, users: User[]): string => {
  if (!content || users.length === 0) return content;

  // Find all @mentions in the content
  const mentionRegex = /@(\w+)/g;
  let processedContent = content;
  const matches = Array.from(content.matchAll(mentionRegex));

  // Process each mention
  for (const match of matches) {
    const mentionText = match[1]; // The text after @
    const fullMatch = match[0]; // The full @mention

    // Try to find matching user
    const matchedUser = users.find((user) => {
      const firstName = user.first_name?.toLowerCase() || '';
      const emailName = user.email.split('@')[0].toLowerCase();
      const searchText = mentionText.toLowerCase();

      return firstName === searchText || emailName === searchText;
    });

    if (matchedUser) {
      // Replace with API format
      processedContent = processedContent.replace(
        fullMatch,
        `@user:${matchedUser.id}`
      );
    }
  }

  return processedContent;
};

/**
 * Convert API format mentions (@user:123) to display format (@FirstName)
 */
export const convertMentionsToDisplayFormat = (
  content: string,
  users: { [key: number]: User }
): string => {
  if (!content) return content;

  return content.replace(/@user:(\d+)/g, (match, userId) => {
    const user = users[parseInt(userId)];
    if (user) {
      return `@${user.first_name || user.email.split('@')[0]}`;
    }
    return match;
  });
};
