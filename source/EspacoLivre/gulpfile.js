/// <binding BeforeBuild='copy' />
var gulp = require("gulp");

gulp.task("copy", function () {
    gulp.src("./bower_components/jquery/dist/**").pipe(gulp.dest("./www/lib/jquery"));
});