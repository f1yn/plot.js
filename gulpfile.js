/**
 * Created by flynn on 05/06/17.
 */

let gulp = require('gulp');
let uglify = require('gulp-uglify');
let rename = require('gulp-rename');
let babel = require('gulp-babel');
let gutil = require('gulp-util');
let pump = require('pump');
let jsdoc = require('gulp-jsdoc3');

const buildDir = './dist';

gulp.task('build', () => {
    pump([
        gulp.src('src/plot.js'),
        babel({ presets: ['es2015'] }).on('error', gutil.log),
        gulp.dest(buildDir), // the full output
        uglify().on('error', gutil.log),
        rename({ suffix: '.min'}),
        gulp.dest(buildDir) // minified output
    ]);
});

gulp.task('doc', () =>{
    gulp.src(['README.md', './src'], {read: false})
        .pipe(jsdoc());
});