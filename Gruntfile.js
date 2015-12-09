module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				// define a string to put between each file in the concatenated output
				//separator: ';'
			},
			dist: {
				// the files to concatenate
				src: ['js/_vs.js', 'js/_vs.phy.js', 'js/_vs.chart.js', 'js/_vs.draw.js', 'js/_vs.token2.js', 'js/_vs.stream.js', 'js/_vs.decay.js', 'js/_vs.strata.js', 'js/_vs.flocculate.js', 'js/_vs.aggregate.js', 'js/_vs.chart.stackedareachart.js', 'js/_vs.chart.circlelayout.js'],
				// the location of the resulting JS file
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'dist/<%= pkg.name %>.js',
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		},
		wiredep: {

			task: {

				// Point to the files that should be updated when
				// you run `grunt wiredep`
				src: [
      				'examples/**/*.html'
    			],
				options: {
					// See wiredep's configuration documentation for the options
					// you may pass:

					// https://github.com/taptapship/wiredep#configuration
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-wiredep');

	grunt.registerTask('default', ['concat', 'uglify']);

};
