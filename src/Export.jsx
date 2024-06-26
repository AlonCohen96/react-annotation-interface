import React, {useEffect} from "react"
import { IconButton } from "@material-ui/core"
import DownloadIcon from '@mui/icons-material/Download'
import Tooltip from "@material-ui/core/Tooltip"
import {icon, globalControlsBtn} from "./styles.js"
import {ANNOTATED_AREA} from "./species.js";

function Export( { tracks, allLabels, annotationInstance, exportRequest, passExportRequestToApp, deleteAllLabelsInApp } ){

    function handleClick(){
        passExportRequestToApp(true)
    }

    function exportCSV(){
        // Remove the Annotated Area labels because they are only necessary for WhisperSeg
        let newLabelsArray = allLabels.filter( label => label.species !== ANNOTATED_AREA )

        // Assign each label it's correct trackIndex
        newLabelsArray = newLabelsArray.map( label => {
            const correctChannelIndex = tracks.find( track => track.trackID === label.trackID).channelIndex
            return {
                ...label,
                channelIndex: correctChannelIndex
            }
        })

        // Sort the labels ascending by onset
        //newLabelsArray = newLabelsArray.sort( (firstLabel, secondLabel ) => firstLabel.onset - secondLabel.onset )

        // Transform to CSV data
        let csvData = newLabelsArray.map(label => `${label.onset},${label.offset},${label.species},${label.individual},${label.clustername},${label.filename},${label.channelIndex}`)
        csvData.unshift('onset,offset,species,individual,clustername,filename,channelIndex')
        csvData = csvData.join('\n')

        const newCSVFileName = annotationInstance ? `${annotationInstance}.csv` : 'annotations.csv'

        const element = document.createElement('a')
        element.setAttribute('href', `data:text/csv;charset=utf-8,${csvData}`)
        element.setAttribute('download', newCSVFileName)

        document.body.appendChild(element)
        element.click()
        element.remove()
    }

    // When all the tracks have pushed their labels to allLabels state variable in App.jsx
    useEffect( () => {
        if (!allLabels || !exportRequest) return
        exportCSV()
        passExportRequestToApp(false)
        deleteAllLabelsInApp()
    }, [allLabels])

    return (
        <Tooltip title="Download Annotations">
            <IconButton
                style={globalControlsBtn}
                onClick={handleClick}
            >
                <DownloadIcon style={icon} />
            </IconButton>
        </Tooltip>
    )
}

export default Export
