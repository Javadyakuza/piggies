const telegramAppBaseUrl = "http://localhost:3000";
// const telegramAppBaseUrl = `https://t.me/kamyar14040204_bot/test`;

export const generateRefLink = (refId: string): string => {
  return `${telegramAppBaseUrl}/register?refId=${refId}`;
};
