const isTest = process.env.NODE_ENV === "test" || process.env.VITEST_WORKER_ID;

const config = {
  plugins: isTest ? [] : ["@tailwindcss/postcss"],
};

export default config;
