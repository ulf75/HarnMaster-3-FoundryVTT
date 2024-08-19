import gulp from 'gulp';
import autoPrefixer from 'gulp-autoprefixer';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import nodeSass from 'node-sass';

const sass = gulpSass(nodeSass);

/* ----------------------------------------- */
/*  Compile Sass
/* ----------------------------------------- */

// Small error handler helper function.
function handleError(err) {
    console.log(err.toString());
    this.emit('end');
}

const SYSTEM_SCSS = ['scss/**/*.scss'];
function compileScss() {
    // Configure options for sass output. For example, 'expanded' or 'nested'
    let options = {
        outputStyle: 'expanded'
    };
    return gulp

        .src(SYSTEM_SCSS)
        .pipe(sass(options).on('error', handleError))
        .pipe(
            autoPrefixer({
                cascade: false
            })
        )
        .pipe(gulp.dest('./css'));
}
export const css = gulp.series(compileScss);

gulp.task('sass', function () {
    return gulp
        .src(SYSTEM_SCSS)
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sass())
        .pipe(sourcemaps.write('.', {addComment: false, includeContent: false}))
        .pipe(gulp.dest('./css'));
    // .pipe(
    //     bs.reload({
    //         stream: true
    //     })
    // );
});

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
    gulp.watch(SYSTEM_SCSS, css);
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

// exports.default = gulp.series(compileScss, watchUpdates);
// exports.css = css;
