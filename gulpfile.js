const { src, dest, watch, series, parallel, task } = require('gulp');

const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const iife = require("gulp-iife");

function logError(err) {
	console.error('* gulp-terser error', err.message, err.filename, err.line, err.col, err.pos);
}

function jsTask(done, srcURL, buildPath) {
	return src([
			srcURL + 'src/cool.js',
			srcURL + 'src/CFGGenerator.js',
			srcURL + 'src/Markov.js',
		])
		.pipe(sourcemaps.init())
		.pipe(concat('text_tools.min.js'))
		.pipe(iife({}))
		.pipe(terser().on('error', logError))
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest(buildPath))
}

function watchTask(){
	watch('./src/**/*.js', series('buildTask'));
}

function buildTask() {
	return jsTask(null, './', './build', false);
}

function exportTask() {
	return jsTask(null, './text_tools/', './text_tools/build', false);
}

function copyData(destinationPath) {
	return src([
			'./text_tools/data/*.json',
		], { base: './text_tools/data/' })
		.pipe(dest(destinationPath));
}

task('build', buildTask);
task('watch', watchTask);
task('default', series(buildTask, watchTask));

module.exports = {
	exportTask: exportTask,
	copyData: copyData,
	files: [ './text_tools/src/**/*.js' ]
};