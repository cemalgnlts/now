import esbuild from "esbuild";

await esbuild.build({
    globalName: "Now",
    entryPoints: ["now.js"],
    outdir: "libs/",
    format: "iife",
    target: "es2020",
    minify: true
});

await esbuild.build({
    entryPoints: ["worker.js"],
    outdir: "libs/",
    format: "iife",
    target: "es2020",
    minify: true
});