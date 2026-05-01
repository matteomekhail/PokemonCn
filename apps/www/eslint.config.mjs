import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".open-next/**", ".wrangler/**", "public/r/**"],
  },
];

export default eslintConfig;
