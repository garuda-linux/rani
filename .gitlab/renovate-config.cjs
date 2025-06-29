module.exports = {
  platform: 'gitlab',
  endpoint: process.env.CI_API_V4_URL,
  token: process.env.ACCESS_TOKEN,
  onboarding: false,
  onboardingConfig: {
    extends: ['config:recommended'],
  },
  repositories: [process.env.CI_PROJECT_PATH],
};
