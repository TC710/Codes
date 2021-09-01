Guide to setup react https://code.visualstudio.com/docs/nodejs/reactjs-tutorial
Guide for API with Node.js with Express https://www.youtube.com/watch?v=pKd0Rpw7O48
To install express (Static server - page will not reflect change made)
When downloading Node.js npm is also downloaded
In the terminal go to project folder where express is going to be used 
	> npm init 
	> npm install express --save

I zipped the node_modules which contains the library for express, if you already has it than folder not needed

To make it more dynamic need to install EJS
https://www.section.io/engineering-education/static-site-dynamic-nodejs-web-app/

To have the image load need a folder that can be statically accessed.
	> app.use(express.static(**dirname));
	//This allow access to the root dir however this has security risk because they can view anything from the dir
	> const path = require('path')
	> const dir = path.join(**dirname, 'public');
	> app.use(express.static(dir));
	//This make a folder name 'public' from root dir statically accessible which should contain file that ok to be viewed
	ex. how the folder should look
	root 
		- index.js 
		- pubic 
			- image 
				- image.jpg
I recommand to add the HTML file into the 'public' folder too because the src of image in the HTML using relative path will refer the root where the
HTML is located. If kept in the root dir without the path change launching with Node.js is ok, it change the root for the asset file to 'public' folder
but, the image will not load if lauching the HTML alone.
