import IconButton from "@material-ui/core/IconButton";
import {iconBtnDisabled} from "./styles.js";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh.js";
import Tooltip from "@material-ui/core/Tooltip";
import React, {useEffect, useState} from "react";
import ModelsWindow from "./ModelsWindow.jsx";
import axios from "axios";
import {toast} from "react-toastify";

function WhisperSeg(
        {
            audioId,
            minFreq,
            labels,
            speciesArray,
            passLabelsToScalableSpec,
            passWhisperSegIsLoadingToScalableSpec,
            activeIconBtnStyle,
            activeIcon,
            strictMode,
            passSpeciesArrayToApp,
            assignSpeciesInformationToImportedLabels
        }
    )
{

    const [showModelsWindow, setShowModelsWindow] = useState(false)
    const [modelsAreLoading, setModelsAreLoading] = useState(false)
    const [modelsAvailableForFinetuning, setModelsAvailableForFinetuning] = useState()
    const [modelsAvailableForInference, setModelsAvailableForInference] = useState()
    const [modelsCurrentlyTrained, setModelsCurrentlyTrained] = useState()
    const [currentlyTrainedModelsNames, setCurrentlyTrainedModelsNames] = useState([])

    const passShowModelsWindowToWhisperSeg = ( boolean) => {
        setShowModelsWindow( boolean )
    }

    const passCurrentlyTrainedModelsNamesToWhisperSeg = ( updatedArray ) => {
        setCurrentlyTrainedModelsNames( updatedArray )
    }

    const handleClickWhisperSeg = () => {
        setShowModelsWindow(true)
    }

    const getAllModels = async () => {
        if (!showModelsWindow && currentlyTrainedModelsNames.length === 0) return
        /* Add additional run condition:
        * Function should run when window is open or when user has sent a finetune request. (Store that information in a state)
        * */

        setModelsAreLoading(true)

        try {
            const [inferenceModels, finetuneModels, currentlyTrainedModels] = await Promise.all([
                getModelsAvailableForInference(),
                getModelsAvailableForFinetuning(),
                getModelsCurrentlyTrained()
            ])

            setModelsAreLoading(false)
            setModelsAvailableForInference(inferenceModels)
            setModelsAvailableForFinetuning(finetuneModels)
            setModelsCurrentlyTrained(currentlyTrainedModels)

        } catch (error) {
            toast.error('An error occurred trying to access the WhisperSeg API. Check the console for more information')
            console.error('Error fetching data:', error)
            setModelsAreLoading(false)
            setShowModelsWindow(false)
        }
    }

    const getModelsAvailableForInference = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-available-for-inference'

        const response = await axios.post(path, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const placeholder = {'response': [{'eta': '00:23:32',
                'model_name': 'whisperseg-base',
                'status': 'In progress'},
                {'eta': '--:--:--', 'model_name': 'whisperseg-large', 'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg_base',
                    'status': 'progress'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg-base-v2.0',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg-large',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'new-whisperseg-bengalese-finch',
                    'status': 'ready'}]}

        return response.data.response
        //return placeholder.response
    }

    const getModelsAvailableForFinetuning = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-available-for-finetuning'


        const response = await axios.post(path, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })


        const placeholder = {'response': [{'eta': '--:--:--',
                'model_name': 'whisperseg-base',
                'status': 'ready'},
                {'eta': '--:--:--', 'model_name': 'whisperseg-large', 'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg_base',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg-base-v2.0',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg-large',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'new-whisperseg-bengalese-finch',
                    'status': 'ready'}]}

        return response.data.response
    }

    const getModelsCurrentlyTrained = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-training-in-progress'

        const response = await axios.post(path, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        return response.data.response
    }


    /* ++++++++++++++++++ useEffect Hooks ++++++++++++++++++ */

    // When user clicks on CallWhisperSeg button
    useEffect(() => {
        // Get Models immediately
        getAllModels()

        // Set up an interval that will refresh the models every 10 seconds
        const interval = setInterval(() => {
            getAllModels()
        }, 10000)

        // Clean up the interval on component unmount
        return () => clearInterval(interval)
    }, [showModelsWindow])

    // When currently trained models change, check if a new model has finished training and display a pop-up
    useEffect( () => {
        if (!modelsCurrentlyTrained) return

        const allCurrentlyTrainedModelNames = modelsCurrentlyTrained.map(model => model.model_name)

        const updatedModelsInTrainingQueue = []

        for (const modelName of currentlyTrainedModelsNames){
            if (allCurrentlyTrainedModelNames.includes(modelName)){
                updatedModelsInTrainingQueue.push(modelName)
            } else {
                toast.success(`New custom model "${modelName}" has finished training!`)
            }
        }

        passCurrentlyTrainedModelsNamesToWhisperSeg(updatedModelsInTrainingQueue)

    }, [modelsCurrentlyTrained])

    return (
        <>
            <Tooltip title="Call WhisperSeg">
                <IconButton
                    style={{...activeIconBtnStyle, ...((strictMode || !audioId) && iconBtnDisabled)}}
                    disabled={strictMode || !audioId}
                    onClick={handleClickWhisperSeg}
                >
                    <AutoFixHighIcon style={activeIcon}/>
                </IconButton>
            </Tooltip>

            {showModelsWindow &&
                <ModelsWindow
                    modelsAreLoading={modelsAreLoading}
                    modelsAvailableForInference={modelsAvailableForInference}
                    modelsAvailableForFinetuning={modelsAvailableForFinetuning}
                    modelsCurrentlyTrained={modelsCurrentlyTrained}
                    passShowModelsWindowToWhisperSeg={passShowModelsWindowToWhisperSeg}
                    audioId={audioId}
                    minFreq={minFreq}
                    labels={labels}
                    speciesArray={speciesArray}
                    passLabelsToScalableSpec={passLabelsToScalableSpec}
                    passWhisperSegIsLoadingToScalableSpec={passWhisperSegIsLoadingToScalableSpec}
                    passSpeciesArrayToApp={passSpeciesArrayToApp}
                    assignSpeciesInformationToImportedLabels={assignSpeciesInformationToImportedLabels}
                    currentlyTrainedModelsNames={currentlyTrainedModelsNames}
                    passCurrentlyTrainedModelsNamesToWhisperSeg={passCurrentlyTrainedModelsNamesToWhisperSeg}
                />
            }

        </>
    )
}

export default WhisperSeg