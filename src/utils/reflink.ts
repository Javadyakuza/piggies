const telegramAppBaseUrl = "https://t.me/piggiesdev_bot/pigdev/";
// const telegramAppBaseUrl = `https://t.me/kamyar14040204_bot/test`;

export const generateRefLink = (refId: string): string => {
  return `${telegramAppBaseUrl}start?startapp=register_${refId}`;
};
