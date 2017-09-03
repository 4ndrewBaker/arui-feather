/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint import/no-extraneous-dependencies: [2, {"devDependencies": true}] */

const buffer = require('vinyl-buffer');
const del = require('del');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const merge = require('merge-stream');
const responsive = require('gulp-responsive');
const spritesmith = require('gulp.spritesmith');

const SIZES = ['s', 'm', 'l', 'xl'];
const RATIOS = ['1x', '2x'];
const DIMENSIONS = {
    s: [20, 15],
    m: [40, 30],
    l: [60, 45],
    xl: [80, 60]
};

const FLAG_SPRITE_CSS_DIR = './';
const FLAG_SPRITE_IMG_DIR = './images';
const FLAG_TMP_DIR = '.flag-icon-tmp';

gulp.task('clean:flag-icon', () => del(
    [`${FLAG_SPRITE_CSS_DIR}/flag-icon_size_*.css`, FLAG_SPRITE_IMG_DIR, FLAG_TMP_DIR])
);

function getImageHeightBySize(size, ratio = 1) {
    return {
        width: DIMENSIONS[size][0] * ratio,
        height: DIMENSIONS[size][1] * ratio
    };
}

SIZES.forEach((size) => {
    RATIOS.forEach((ratio) => {
        let ratioInt = parseInt(ratio.match(/\d+/g)[0], 10);

        // ?? — for processing 2-char country code files only (ignore subregions)
        gulp.task(`flag-icon:resize-${size}-${ratio}`, () => gulp.src('../../node_modules/region-flags/png/??.png')
            .pipe(responsive({
                '*': {
                    width: getImageHeightBySize(size, ratioInt).width,
                    height: getImageHeightBySize(size, ratioInt).height,
                    rename: path => path.basename.toLowerCase() + path.extname
                }
            }, {
                background: 'transparent',
                compressionLevel: 6,
                progressive: true,
                embed: true,
                quality: 70,
                withMetadata: false
            }))
            // We need to save files on disk cause of spritesmith's retinaSrcFilter inability to read streams
            .pipe(gulp.dest(`${FLAG_TMP_DIR}/${size}/${ratio}`))
        );
    });

    gulp.task(`flag-icon:sprite-${size}`, RATIOS.map(ratio => `flag-icon:resize-${size}-${ratio}`), () => {
        let spriteData = gulp.src(`${FLAG_TMP_DIR}/${size}/**/*.png`)
            .pipe(spritesmith({
                cssName: `flag-icon_size_${size}.css`,
                imgName: `flag-icon_size_${size}@1x.png`,
                retinaImgName: `flag-icon_size_${size}@2x.png`,
                retinaSrcFilter: [`${FLAG_TMP_DIR}/${size}/2x/*.png`],
                cssTemplate: `${FLAG_SPRITE_CSS_DIR}/flag-icon.css.handlebars`,
                cssOpts: { size },
                cssVarMap: (sprite) => {
                    sprite.selector = `.flag-icon_country_${sprite.name}`;

                    // https://github.com/twolfson/gulp.spritesmith/issues/124
                    if (sprite.source_image.indexOf('2x') !== -1) { sprite.name += '-2x'; }
                }
            }));

        let imageStream = spriteData.img
            .pipe(buffer())
            .pipe(imagemin([
                imagemin.optipng({ optimizationLevel: 6 })
            ]))
            .pipe(gulp.dest(FLAG_SPRITE_IMG_DIR))
            .on('end', () => { del(FLAG_TMP_DIR); });

        let cssStream = spriteData.css
            .pipe(gulp.dest(FLAG_SPRITE_CSS_DIR));

        return merge(imageStream, cssStream);
    });
});

gulp.task('default', ['clean:flag-icon'].concat(SIZES.map(size => `flag-icon:sprite-${size}`)));
