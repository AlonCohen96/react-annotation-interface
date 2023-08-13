import {useState} from "react";
import axios from "axios";

function AudioUpload({passAudioDOMObjectURLToApp, passBase64UrlToApp, passAudioFileNameToApp} ){

    // Audio Upload and fetch Spectrogram Image implementation
    function handleFileDropped(newFile){
        const formData = new FormData();
        formData.append("newAudioFile", newFile)
        passAudioFileNameToApp( newFile.name )

        const url = URL.createObjectURL(newFile)
        passAudioDOMObjectURLToApp( url )

        getSpectrogramFromBackend(formData)
    }

    function getSpectrogramFromBackend(formData){
        axios.post('/upload', formData)
            .then(response => passBase64UrlToApp(response.data))
            .catch((error) => console.log(error.response))
    }


    // Drag & Drop implementation
    const [dragActive, setDragActive] = useState(false)

    function handleDrag(event){
        event.preventDefault()
        event.stopPropagation()
        if (event.type === 'dragenter' || event.type === 'dragover') {
            setDragActive(true)
        } else if (event.type === 'dragleave') {
            setDragActive(false)
        }
    }

    function handleDrop(event){
        event.preventDefault()
        event.stopPropagation()
        setDragActive(false)
        if (event.dataTransfer.files && event.dataTransfer.files[0]){
            handleFileDropped(event.dataTransfer.files[0])
        }
    }

    function handleChange(event){
        event.preventDefault()
        setDragActive(false)
        if (event.dataTransfer.files && event.dataTransfer.files[0]){
            handleFileDropped(event.dataTransfer.files[0])
        }
    }

    return (
        <form
            className='form-file-upload'
            onDragEnter={handleDrag}
            onSubmit={(event) => event.preventDefault()}
        >
            <input
                className='input-file-upload'
                type='file'
                multiple={false}
                onChange={handleChange}
            />
            <label
                className='label-file-upload'
                htmlFor='input-file-upload'
                isdragactive={dragActive ? 'true' : 'false'}
            >
            <div>
                Drag and drop your WAV file or click here to upload
            </div>
            </label>
            {
                dragActive &&
                <div
                    className='drag-file-element'
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}>
                </div>
            }
        </form>
    )
}

export default AudioUpload