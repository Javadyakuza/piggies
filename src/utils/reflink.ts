const telegramAppBaseUrl = "https://t.me/piggiesdemobot/piggiesdemo";
// const telegramAppBaseUrl = `https://t.me/kamyar14040204_bot/test`;

export const generateRefLink = (refId: string): string => {
  return `${telegramAppBaseUrl}/register?refId=${refId}`;
};
