import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  try {
    const spec = createSwaggerSpec({
      apiFolder: "pages/api",
      definition: {
        openapi: "3.0.0",
        info: {
          title: "Piggies Referral API",
          version: "1.0.0",
          description: "API for Pig Referral App with Telegram and TON Connect integration",
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [],
      },
    });
    return spec;
  } catch (error) {
    console.error("Error generating Swagger spec:", error);
    throw error;
  }
};