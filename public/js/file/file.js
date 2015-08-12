// **************************************************************** //
// file.js - Return a file item DOM object with all attributes and event listeners 
function fileItem(path, currentFile, panel) {
	var file = document.createElement('li');
	var extIndex = currentFile.filename.indexOf('.')+1;
	var extension = currentFile.filename.substr(extIndex);
	file.id = currentFile.filename;
	file.className = 'file';
	file.style.padding = '0.3rem';
	file.style.paddingLeft = '1.5rem';
	file.style.paddingRight = '0rem';
	file.style.color = '#545454';
	file.draggable = 'true';
	
	// Set custom html attributes for the command interpreter
	file.obj = { 
		'path'		: path,
		'panel'		: panel,
		'attrs'		: currentFile.attrs,
		'filename'	: currentFile.filename,
		'longname'	: currentFile.longname,
		'extension'	: extension
	};
	
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	// Assign some listeners and event attributes to each list item
	file.addEventListener('click', function(ev) { uponClick(ev, this) }, false);
	file.addEventListener("dblclick", function() { uponDblClick(this) }, false);
	file.addEventListener("contextmenu", function(ev) {ev.preventDefault();}, false);
	file.ondragstart = function(ev) { ev.dataTransfer.setData('id', ev.target.id); };
	file.ondragover = function(ev) { ondragoverCall(ev) };
	file.ondrop = function(ev) { ondropCall(ev); };

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	// Depending on filetype assign an appropriate icon and event listener
	if(currentFile.attrs.isDirectory) {
		file.style.background = "url('../images/files/dir.svg') "
							  + "no-repeat 1% 50%";
	
		// Add a listener to change the drag ghost image to a directory icon
		file.addEventListener("dragstart", function(e) { 
			dragImageListener(e, '../images/files/dir.svg');
		}, false);
	} else {
		// Assign the file its corresponding extension icon if its icon exists 
		if(!extensionImageExists(extension)) 
		 	 file.style.background = "url('../images/files/idk.svg')"
								   + "no-repeat 1% 50%";
		else if(currentFile.filename.indexOf('.') > 1) 
			 file.style.background = "url('../images/files/"
								   + extension+".svg') no-repeat 1% 50%";
		else file.style.background = "url('../images/files/idk.svg')"
								   + "no-repeat 1% 50%";
		
		// Add a listener to change the drag ghost image to a file icon
		file.addEventListener("dragstart", function(e) {
			var dragImg;
			if(!extensionImageExists(this.obj.extension)) 
				dragImg = "../images/files/idk.svg"
			else if(this.obj.filename.indexOf('.') > 1) 
				dragImg = "../images/files/"+this.obj.extension+".svg";
			else dragImg = "../images/files/idk.svg"
			dragImageListener(e, dragImg);
		}, false);
	}
	
	file.style.backgroundSize = '1rem';
	file.innerHTML = currentFile.filename;

	return file;
}

