import {useState, useRef, useEffect} from 'react'
import Visuals from "./Visuals.jsx"
import Clusternames from "./Clusternames.jsx"
import AudioUpload from "./AudioUpload.jsx"
import CSVReader from "./CSVReader.jsx"
import ScalableSpec from "./ScalableSpec.jsx";
import Searchbar from "./Searchbar.jsx"
import SpecType from "./SpecType.jsx";
import Parameters from "./Parameters.jsx";

function App() {
    const audioDOMObject = useRef(null)
    const [response, setResponse] = useState(null)
    const [audioFileName, setAudioFileName] = useState(null)
    const [importedLabels, setImportedLabels] = useState([]);
    const [importedClusternameButtons, setImportedClusternameButtons] = useState([])
    const [activeClustername, setActiveClustername] = useState()
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)
    const [specType, setSpecType] = useState('log-mel')
    const [nfft, setNfft] = useState(null)
    const [binsPerOctave, setBinsPerOctave] = useState(null)
    const [parameters, setParameters] = useState({})

    function passAudioDOMObjectURLToApp(url){
        audioDOMObject.current.setAttribute('src', url)
    }

    function passResponseToApp(newResponse){
        setResponse( newResponse )
    }

    function passAudioFileNameToApp(newAudioFileName){
        setAudioFileName( newAudioFileName )
    }

    function passLabelsToApp(newLabels){
        setImportedLabels( newLabels )
    }

    function passClusterNameButtonsToApp(newClusternameButtons){
        setImportedClusternameButtons( newClusternameButtons )
    }

    function passActiveClusternameToApp(chosenClustername){
        setActiveClustername( chosenClustername )
    }

    function passSpectrogramIsLoadingToApp(boolean){
        setSpectrogramIsLoading( boolean )
    }

    function passSpecTypeToApp(chosenSpecType){
        setSpecType( chosenSpecType )
    }

    function passNfftToApp( chosenNfft ){
        setNfft( chosenNfft )
    }

    function passBinsPerOctaveToApp ( binsPerOctave ){
        setBinsPerOctave (binsPerOctave)
    }

    function passParametersToApp (newParametersObject){
        setParameters( newParametersObject )
    }

    return (
        <>
            <div id='files-upload-container'>
                <Searchbar />
                <AudioUpload
                    passAudioDOMObjectURLToApp={passAudioDOMObjectURLToApp}
                    passResponseToApp={passResponseToApp}
                    passAudioFileNameToApp={passAudioFileNameToApp}
                    passSpectrogramIsLoadingToApp={passSpectrogramIsLoadingToApp}
                />
                <audio preload="metadata" ref={audioDOMObject}></audio>
                <CSVReader
                    passLabelsToApp={passLabelsToApp}
                    passClusterNameButtonsToApp={passClusterNameButtonsToApp}
                />
                <SpecType
                    specType={specType}
                    passSpecTypeToApp={passSpecTypeToApp}
                    passNfftToApp={passNfftToApp}
                    passBinsPerOctaveToApp={passBinsPerOctaveToApp}
                />
                {/*
                <Parameters
                    parameters={parameters}
                    passParametersToApp={passParametersToApp}
                />
                */}
            </div>
            <ScalableSpec
                response={response}
                audioFileName={audioFileName}
                importedLabels={importedLabels}
                activeClustername={activeClustername}
                spectrogramIsLoading={spectrogramIsLoading}
                passSpectrogramIsLoadingToApp={passSpectrogramIsLoadingToApp}
                specType={specType}
                nfft={nfft}
                binsPerOctave={binsPerOctave}
                parameters={parameters}
            />
            {/*
             <Visuals
                audioFile={audioDOMObject.current}
                audioFileName={audioFileName}
                base64Url={base64Url}
                spectrogramIsLoading={spectrogramIsLoading}
                importedLabels={importedLabels}
                activeClustername={activeClustername}
            />
            */}

            <Clusternames
                passActiveClusternameToApp={passActiveClusternameToApp}
                importedClusternameButtons={importedClusternameButtons}
                audioFileName={audioFileName}
            />

        </>
    )
}

export default App