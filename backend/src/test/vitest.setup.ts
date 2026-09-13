process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret_test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_test_refresh_secret";
process.env.PAYMENT_PROVIDER = "mock";
process.env.PAYMENT_WEBHOOK_SECRET = "test_webhook_secret";
process.env.USE_IN_MEMORY_DB = "false"; // tests manage their own in-memory Mongo lifecycle
process.env.WEB_URL = "http://localhost:3000";
