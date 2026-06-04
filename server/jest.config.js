module.exports = {
	testEnvironment: "node",
	testMatch: ["**/src/**/*.test.js"],
	coverageDirectory: "coverage",
	collectCoverageFrom: ["src/**/*.js", "!src/index.js"],
	verbose: true,
};
