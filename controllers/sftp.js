// **************************************************************** //
// Establish server side sftp connection
var fs = require('fs');
var path = require('path');
var async = require('async');
var retrieve = require('./retrieve.js');

// ye
function run(socket, sftp, command, file1, file2) {
	switch(command) {
		case 'cd':
			cd(socket, sftp, command, file1);
			break;
		case 'get':
			get(socket, sftp, command, file1, file2);
			break;
		case 'put':
			put(socket, sftp, command, file1, file2);
			break;	
		case 'getlocally':

			break;
		case 'putlocally':
			
			break;
		default: break;

	}
}

exports.run = run;

// **************************************************************** //
// Append an appropriate forward slash for any pathname 
function cleanup(file) {
	// Clean up the pathname (append '/' at the end if necessary)
	if(file.path.lastIndexOf('/') !== file.path.length-1 &&
		file.path.length > 1) file.path += '/';
	return file;
}

// **************************************************************** //
// Change Directory (cd) sftp command - user double clicks
// --> requires file.path, panel, filename 
var gSFTP;
function cd(socket, sftp, command, file) {
	console.log('--> in cd()');

	gSFTP = sftp;
	file = cleanup(file);
	var path = file.path+file.filename;	
		
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	// Change the directory of the local host
	if(file.panel === 'local') {
		var data = retrieve.localFiles(path);
		// Send the file attribute information to the client
		if(data) socket.emit('update', data);
		else return;
	}
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	// Change the directory of the remote host
	else if(file.panel === 'remote') {
		// Send the file attribute information to the client
		retrieve.remoteFiles(sftp, path).then(function(data) {
			socket.emit('update', data);
		}).catch( function(reason) {
			console.log("Error (retrieve.remoteFiles): "+reason);
			socket.emit('error', reason);
		});
	}	
	else { console.log("Unknown host!"); }
}

// **************************************************************** //
// Transfer file local (file1) -> remote (file2) sftp put command 
// --> requires file1.path+filename & file2.path
function put(socket, sftp, command, localFile, remoteFile) {
	console.log("--> in put()");

	var originPath = '';
	var targetPath = '';
	localFile = cleanup(localFile);
	remoteFile = cleanup(remoteFile);

	// The local file was dropped onto a file, so put it in the current directory
	if((!localFile.attrs.isDirectory && !remoteFile.attrs.isDirectory) || 
	  (localFile.attrs.isDirectory && !remoteFile.attrs.isDirectory)) {
		originPath = localFile.path + localFile.filename;
		targetPath = remoteFile.path + localFile.filename;	
	} else { // The local file was dropped onto a directory
		originPath = localFile.path + localFile.filename;
		targetPath = remoteFile.path + remoteFile.filename + '/' + localFile.filename
	}
	 
	// Tar compress the local file if it is a directory
	if(localFile.attrs.isDirectory)
		localFile = tarCompress(localFile);
	
	// Transfer by 1/2 mb chunks 
	var options = {
		// concurrency : 25,
		// chunkSize	: 32768,

		concurrency	: 50,
		chunkSize	: 1000,
		step		: function(transferred, chunk, total) {
			var percentage = (Math.floor(transferred/total*10000)/100);
			socket.emit('progress', percentage);
		}
	};

	console.log('Origin Path (local host): '+originPath);
	console.log('Target Path (remote host): '+targetPath);

	// SFTP put command with local/remote file path and options
	sftp.fastPut(originPath, targetPath, options, function(err) {
		if(err) {
			console.log('Error (sftp.fastPut): '+err);
			return;
		}
		console.log("Finished transferring");
		socket.emit('progress complete', remoteFile.path);
	});
}

function tarCompress(file) {
	return file;
}

// **************************************************************** //
// Transfer file remote (file1) -> local (file2) sftp get command 
// --> requires file.path+filename & dropped.path+filename
function get(socket, sftp, command, remoteFile, localFile) {
	console.log("--> in get()");

	var originPath = '';
	var targetPath = '';
	remoteFile = cleanup(remoteFile);
	localFile = cleanup(localFile);

	// The remote file was dropped onto a file, so put it in the current directory
	if((!remoteFile.attrs.isDirectory && !localFile.attrs.isDirectory) || 
	  (remoteFile.attrs.isDirectory && !localFile.attrs.isDirectory)) {
		originPath = remoteFile.path + remoteFile.filename;
		targetPath = localFile.path + remoteFile.filename;
	} else { // The remote file was dropped onto a directory
		originPath = remoteFile.path + remoteFile.filename;
		targetPath = localFile.path + localFile.filename + '/' + remoteFile.filename;
	}
	 
	// Tar compress the remote file if it is a directory
	if(remoteFile.attrs.isDirectory)
		remoteFile = tarCompress(remoteFile);
	
	// Transfer by 1/2 mb chunks 
	var options = {
		// concurrency : 25,
		// chunkSize	: 32768,

		concurrency	: 50,
		chunkSize	: 1000,
		step		: function(transferred, chunk, total) {
			var percentage = (Math.floor(transferred/total*10000)/100);
			socket.emit('progress', percentage);
		}
	};

	console.log('Origin Path (remote host): '+originPath);
	console.log('Target Path (local host): '+targetPath);

	// SFTP put command with local/remote file path and options
	sftp.fastGet(originPath, targetPath, options, function(err) {
		if(err) {
			console.log('Error (sftp.fastGet): '+err);
			return;
		}
		console.log("Finished transferring");
		socket.emit('progress complete', localFile.path);
	});
}

// **************************************************************** //
// file object example content 
// file = {
//   "path": "/Users/username",
//	  "panel": "local",
//	  "attrs": {
//	    "dev": 16777223,
//	    "mode": 16877,
//	    "nlink": 3,
//	    "uid": 501,
//	    "gid": 20,
//	    "rdev": 0,
//	    "blksize": 4096,
//	    "ino": 1993373,
//	    "size": 102,
//	    "blocks": 0,
//	    "atime": "2015-08-01T10:17:28.000Z",
//	    "mtime": "2015-04-15T05:42:28.000Z",
//	    "ctime": "2015-04-15T05:42:28.000Z",
//	    "birthtime": "2015-04-15T05:42:28.000Z",
//	    "isDirectory": true
//	  },
//	  "filename": ".test",
//	  "longname": ""
//	}
//		// Another working file transfer method:
//		var readStream = fs.createReadStream(file1.path+file1.filename);
//		var writeStream = sftp.createWriteStream(file2.path+file1.filename);
//		
//		writeStream.on('error', function(err) {
//			if(err) console.log("Error (writeStream.onError): "+err);
//		});
//		writeStream.on('close', function() {
//			console.log('Stream closed!');
//		});
//
//		readStream.pipe(writeStream);
