import React from "react";
import axios from "axios";

function FileUpload( {passSelectedFileToScalableSpec, passResponseToScalableSpec, passSpectrogramIsLoadingToScalableSpec, passLongestTrackDurationToApp} ) {

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'audio/wav') {
            passSelectedFileToScalableSpec( file )
            passSpectrogramIsLoadingToScalableSpec( true )
            upload(file)
        } else {
            alert('Please select a valid .wav file.')
        }
    }

    const upload = ( file ) => {
        if (!file) return
        const formData = new FormData();
        formData.append('newAudioFile', file)
        getBase64String( formData )
    }

    const getBase64String = async (formData) => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'upload'
        try {
            const response = await axios.post(path, formData)
            passResponseToScalableSpec( response )
            passLongestTrackDurationToApp( response.data.audio_duration )
        } catch (error) {
            console.error("Error uploading file:", error)
        }
    }

    return (
        <div>
            <input type="file" accept=".wav" onChange={handleFileChange} />
        </div>
    )
}

export default FileUpload