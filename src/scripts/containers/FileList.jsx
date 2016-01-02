import React, { Component, PropTypes } from 'react';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import File from '../components/File.jsx';

class FileList extends Component {
    render() {
        return (
            <ul className="bulletless">
                { this.props.files.map((file, i) => <File key={i} filename={file.Filename}/> )}
            </ul>
        );
    }
};

export default DragDropContext(HTML5Backend)(FileList);