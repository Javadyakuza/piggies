const telegramAppBaseUrl = "https://t.me/Piggies_TEST_bot/pig_test/";
// const telegramAppBaseUrl = `https://t.me/kamyar14040204_bot/test`;

export const generateRefLink = (refId: string): string => {
  return `${telegramAppBaseUrl}start?startapp=register_${refId}`;
};
