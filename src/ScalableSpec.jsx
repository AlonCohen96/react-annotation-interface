import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Export from "./Export.jsx";
import FileUpload from "./FileUpload.jsx";
import Parameters from "./Parameters.jsx"

// Classes
class Label {
    constructor(onset, offset, clustername, y, individual, annotator) {
        this.onset = onset
        this.offset = offset
        this.clustername = clustername
        this.y = y
        this.individual = individual
        this.annotator = annotator
    }
}

class Playhead{
    constructor(timeframe) {
        this.timeframe = timeframe
    }
}

// Global variables
const DEFAULT_LABEL_COLOR = "#fff"
const HEIGHT_BETWEEN_INDIVIDUAL_LINES = 15
const ZERO_GAP_CORRECTION_MARGIN = 0.0005

function ScalableSpec(
                        {
                            id,
                            trackDurations,
                            clusternameButtons,
                            showOverviewInitialValue,
                            globalAudioDuration,
                            globalClipDuration,
                            passClipDurationToApp,
                            currentStartTime,
                            currentEndTime,
                            maxScrollTime,
                            scrollStep,
                            SCROLL_STEP_RATIO,
                            passScrollStepToApp,
                            passMaxScrollTimeToApp,
                            passCurrentEndTimeToApp,
                            passCurrentStartTimeToApp,
                            passTrackDurationToApp,
                            deletePreviousTrackDurationInApp,
                            removeTrackInApp,
                            passActiveLabelToApp,
                            activeLabel,
                            activeIndividual,
                            numberOfIndividuals
                        }
                    )
                {

    // General
    const [audioId, setAudioId] = useState(null);

    // Spectrogram
    const specCanvasRef = useRef(null);
    const specImgData = useRef(null)
    const [spectrogram, setSpectrogram] = useState(null);

    // Frequency
    const [frequencies, setFrequencies] = useState(null)
    const frequenciesCanvasRef = useRef(null)

    // Time Axis
    const timeAxisRef = useRef(null);

    // Overview Window
    const overviewRef = useRef(null)
    let newViewportStartFrame = null
    let newViewportEndFrame = null
    let widthBetween_xStartTime_xClicked = null
    let widthBetween_xEndTime_xClicked = null

    // Labels
    const [labels, setLabels] = useState([])
    let clickedLabel = undefined
    let lastHoveredLabel = {labelObject: null, isHighlighted: false}

    // Audio
    const playheadRef = useRef(new Playhead(0))
    const [audioSnippet, setAudioSnippet] = useState(null)

    // Waveform
    const waveformCanvasRef = useRef(null)
    const waveformImgData = useRef(null)
    const [audioArray, setAudioArray] = useState(null)
    const [waveformScale, setWaveformScale] = useState(35)

    // File Upload
    const [response, setResponse] = useState(null)
    const [spectrogramIsLoading, setSpectrogramIsLoading] = useState(false)

    const [parameters, setParameters] = useState({
        spec_cal_method: 'log-mel'
    })

    // Label Canvas
    const labelCanvasRef = useRef(null)

    // WhisperSeg
    const [whisperSegIsLoading, setWhisperSegIsLoading] = useState(false)

    // Active Clustername
    const activeClusternameBTN = clusternameButtons.find(btn => btn.isActive === true)


    /* ++++++++++++++++++++ Pass methods ++++++++++++++++++++ */
    const passResponseToScalableSpec = ( newResponse ) => {
        setResponse( newResponse )
    }

    const passSpectrogramIsLoadingToScalableSpec = ( boolean ) => {
        setSpectrogramIsLoading( boolean )
    }

    const passParametersToScalableSpec = ( newParameters ) => {
        setParameters( newParameters )
    }

    /* ++++++++++++++++++ Backend API calls ++++++++++++++++++ */

    const getAudioClipSpec = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-spec'
        const requestParameters = {
            ...parameters,
            audio_id: audioId,
            start_time: currentStartTime,
            clip_duration: globalClipDuration,
        }

        const response = await axios.post(path, requestParameters)

        return response.data
    }

    const getSpecAndAudioArray = async () => {
        try {
            const [data, newAudioArray] = await Promise.all(
                [
                    getAudioClipSpec(),
                    getAudioArray()
                ]
            )
            drawEditorCanvases(data.spec, data.freqs, newAudioArray)
            setSpectrogramIsLoading(false)
            setSpectrogram(data.spec)
            setFrequencies(data.freqs)
            setAudioArray(newAudioArray)
        } catch (error) {
            console.error('Error fetching data:', error)
            alert(error+' \nPlease try again later.')
        }
    }

    /* ++++++++++++++++++ Mouse Interaction methods ++++++++++++++++++ */

    const handleLMBDown = (event) => {
        // Ignore clicks from other mouse buttons
        if (event.button !== 0) return

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused) return

        const xClicked = getXClicked(event)

        // Deal with click on Onset or Offset to trigger drag methods
        if ( checkIfPositionIsOccupied(xClicked) && event.target.className === 'label-canvas'){
            // Deal with click on Onset
            clickedLabel = checkIfClickedOnOnset(xClicked)
            if ( clickedLabel ){
                specCanvasRef.current.addEventListener('mousemove', dragOnset)
                waveformCanvasRef.current.addEventListener('mousemove', dragOnset)
                labelCanvasRef.current.addEventListener('mousemove', dragOnset)
                return
            }

            // Deal with click on Offset
            clickedLabel = checkIfClickedOnOffset(xClicked)
            if (clickedLabel){
                specCanvasRef.current.addEventListener('mousemove', dragOffset)
                waveformCanvasRef.current.addEventListener('mousemove', dragOffset)
                labelCanvasRef.current.addEventListener('mousemove', dragOffset)
                return
            }
        }

        // Deal with click inside an existing label
        /*
        if (checkIfClickedOnLabel (xClicked) ) {
            alert('Labels of the same individual may not stretch across one another.')
            return
        }*/

        // Add offset to existing label if necessary
        const lastLabel = labels[labels.length-1]
        if (labels.length > 0 && lastLabel.offset === undefined){
            let newOffset = calculateTimestamp(event)
            newOffset = magnet(newOffset)
            /*
            if (!checkIfNewOffsetIsValid(lastLabel.onset, newOffset) ){
                alert('Labels of the same individual may not stretch across one another.')
                return
            }*/
            const labelsCopy = labels
            if (newOffset < lastLabel.onset){
                lastLabel.offset = newOffset
                labelsCopy[labels.length-1] = flipOnsetOffset(lastLabel)
            } else {
                labelsCopy[labels.length-1].offset = newOffset
            }
            setLabels(labelsCopy)
            //drawLine(newOffset)
            passActiveLabelToApp( labelsCopy[labels.length-1] )
            drawLineBetween(lastLabel)
            return
        }

        // Add onset
        let clickedTimestamp = calculateTimestamp(event)
        clickedTimestamp = magnet(clickedTimestamp)
        addNewLabel(clickedTimestamp)
        passActiveLabelToApp( new Label(clickedTimestamp))
    }

    const handleMouseUp = (event) => {
        if (event.button !== 0) return

        removeDragEventListeners()

        //specCanvasRef.current.removeEventListener('mousemove', dragPlayhead)

        if (clickedLabel){
            // flip onset with offset if necessary
            if (clickedLabel.onset > clickedLabel.offset){
                clickedLabel = flipOnsetOffset(clickedLabel)
            }
            // Create zero gap labels if necessary
            clickedLabel.onset = magnet(clickedLabel.onset)
            clickedLabel.offset = magnet(clickedLabel.offset)
            passActiveLabelToApp(new Label(clickedLabel.onset, clickedLabel.offset))
        }

        clickedLabel = undefined
    }

    const removeDragEventListeners = () => {
        console.log('remove drag event listeners')
        specCanvasRef.current.removeEventListener('mousemove', dragOnset)
        specCanvasRef.current.removeEventListener('mousemove', dragOffset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOnset)
        waveformCanvasRef.current.removeEventListener('mousemove', dragOffset)
        labelCanvasRef.current.removeEventListener('mousemove', dragOnset)
        labelCanvasRef.current.removeEventListener('mousemove', dragOffset)
    }

    const handleRightClick = (event) => {
        event.preventDefault()

        // Don't proceed if audio is currently playing
        if (audioSnippet && !audioSnippet.paused) return

        const xClicked = getXClicked(event)
        const labelToBeDeleted = checkIfClickedOnLabel(xClicked)
        deleteLabel(labelToBeDeleted)
        passActiveLabelToApp(null)
    }

    const handleMouseMove = (event) => {
        // Active label get sets to zero once user has set the offset of a label and moved his mouse
        const xHovered = getXClicked(event)
        if (activeLabel && activeLabel.offset && !checkIfClickedOnLabel(xHovered)){
            console.log('setting active label to null')
            passActiveLabelToApp(null)
        }
        hoverLine(event)
        hoverLabel(event)
    }

    const hoverLine = (event) => {
        const xHovered = getXClicked(event)
        if ( checkIfPositionIsOccupied(xHovered) && event.target.className === 'label-canvas' /*|| checkIfClickedOnPlayhead(xHovered)*/){
            specCanvasRef.current.style.cursor = 'col-resize'
            waveformCanvasRef.current.style.cursor = 'col-resize'
            labelCanvasRef.current.style.cursor = 'col-resize'
        } else {
            specCanvasRef.current.style.cursor = 'default'
            waveformCanvasRef.current.style.cursor = 'default'
            labelCanvasRef.current.style.cursor = 'default'
        }
    }

    // this isn't very neat or resourceful, but it works well enough for now. possible candidate for re-factoring in the future
    const hoverLabel = (event) => {
        if (lastHoveredLabel.labelObject && lastHoveredLabel.isHighlighted){
            const specCVS = specCanvasRef.current;
            const specCTX = specCVS.getContext('2d');
            const waveformCVS = waveformCanvasRef.current
            const waveformCTX = waveformCVS.getContext('2d')
            const labelCVS = labelCanvasRef.current
            const labelCTX = labelCVS.getContext('2d')
            specCTX.clearRect(0, 0, specCVS.width, specCVS.height);
            specCTX.putImageData(specImgData.current, 0, 0);
            waveformCTX.clearRect(0, 0, waveformCVS.width, waveformCVS.height)
            waveformCTX.putImageData(waveformImgData.current, 0, 0)
            labelCTX.clearRect(0, 0, labelCVS.width, labelCVS.height)
            drawAllLabels()
            //drawActiveLabel()
            drawPlayhead(playheadRef.current.timeframe)
            lastHoveredLabel.isHighlighted = false
            //console.log('drawing green')
        }

        const mouseX = getXClicked(event)

        for (let label of labels){
            const onsetX = calculateXPosition(label.onset, specCanvasRef.current)
            const offsetX = calculateXPosition(label.offset, specCanvasRef.current)
            if (mouseX >= onsetX && mouseX <= offsetX && !lastHoveredLabel.isHighlighted){
                /*
                if (activeLabel !== label){
                    passActiveLabelToApp(label)
                }
                drawActiveLabel()
                */
                drawLineBetween(label)
                drawClustername(label)
                drawLine(label, label.onset)
                drawLine(label, label.offset)
                lastHoveredLabel.labelObject = label
                lastHoveredLabel.isHighlighted = true
                //console.log('drawing yellow')
                break;
            }
        }
    }


    /* ++++++++++++++++++ Helper methods ++++++++++++++++++ */

    const getXClicked = (event) => {
        const rect = event.target.getBoundingClientRect()
        return event.clientX - rect.left
    }

    const getYClicked = (event) => {
        const rect = event.target.getBoundingClientRect()
        return event.clientY - rect.top
    }

    const calculateXPosition = (timestamp, canvas) => {
        return ( timestamp * canvas.width / globalClipDuration ) - ( currentStartTime * canvas.width / globalClipDuration )
    }

    const calculateYPosition = (label) => {
        return label.individual * HEIGHT_BETWEEN_INDIVIDUAL_LINES
    }

    const calculateTimestamp = (event) => {
        const xClicked = getXClicked(event)
        const ratio = (xClicked / specCanvasRef.current.width)
        return globalClipDuration * ratio + currentStartTime
    }

    const checkIfPositionIsOccupied = (xClicked) => {
        return ( checkIfClickedOnOnset(xClicked) || checkIfClickedOnOffset(xClicked) )
    }

    const checkIfClickedOnOnset = (xClicked) => {
        for (let label of labels){
            const xOnset = calculateXPosition(label.onset, specCanvasRef.current)
            if ( ( xOnset >= xClicked - 10 && xOnset <= xClicked + 10 ) ){
                return label
            }
        }
    }

    const checkIfClickedOnOffset = (xClicked) => {
        for (let label of labels){
            const xOffset = calculateXPosition(label.offset, specCanvasRef.current)
            if ( ( xOffset >= xClicked - 10 && xOffset <= xClicked + 10 ) ){
                return label
            }
        }
    }

    const checkIfClickedOnLabel = (xClicked) => {
        for (let label of labels) {
            const onsetX = calculateXPosition(label.onset, specCanvasRef.current)
            const offsetX = calculateXPosition(label.offset, specCanvasRef.current)
            if (xClicked >= onsetX && xClicked <= offsetX) {
                return label
            }
        }
    }

    const checkIfNewOffsetIsValid = (currentOnset, newOffset) =>{
        for (let label of labels){
            if (label.onset > currentOnset && label.onset < newOffset){
                return false
            }
            if (label.offset > currentOnset && label.offset < newOffset){
                return false
            }
            if (label.onset > newOffset && label.onset < currentOnset){
                return false
            }
            if (label.offset > newOffset && label.offset < currentOnset){
                return false
            }
        }
        return true
    }

    const getCorrectLabelColor = (label) => {
        const correspondingBTN = clusternameButtons.find(btn => btn.clustername === label.clustername)
        return correspondingBTN? correspondingBTN.color: DEFAULT_LABEL_COLOR
    }


    /* ++++++++++++++++++ Draw methods ++++++++++++++++++ */

    const drawEditorCanvases = (spectrogram, frequenciesArray, newAudioArray) => {
        if (!specCanvasRef.current) return

        const specCVS = specCanvasRef.current;
        const specCTX = specCVS.getContext('2d', { willReadFrequently: true, alpha: false });
        const image = new Image();

        const labelCVS = labelCanvasRef.current
        const labelCTX = labelCVS.getContext('2d', { willReadFrequently: true, alpha: true });

        // Draw Spectrogram, Waveform and labels
        image.addEventListener('load', () => {
            specCTX.drawImage(image, 0, 0, specCVS.width, specCVS.height);
            specImgData.current = specCTX.getImageData(0, 0, specCVS.width, specCVS.height);
            drawWaveform(newAudioArray)
            drawFrequenciesAxis(frequenciesArray)
            labelCTX.clearRect(0, 0, labelCVS.width, labelCVS.height)
            drawAllLabels()
            drawActiveLabel()
            //drawPlayhead(playheadRef.current.timeframe)
        })
        image.src = `data:image/png;base64,${spectrogram}`;

        // Draw Time Axis, Viewport
        if (showOverviewInitialValue){
            drawTimeAxis()
            drawViewport(currentStartTime, currentEndTime, 'white', 2)
        }
    }

    const drawTimeAxis = () => {
        const canvas = timeAxisRef.current
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'

        // Drawing horizontal timeline
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(canvas.width, 0)
        ctx.stroke()

        // Drawing first timestamp
        ctx.beginPath()
        ctx.moveTo(1, 0)
        ctx.lineTo(1, canvas.height)
        ctx.stroke()

        // Drawing last timestamp
        ctx.beginPath()
        ctx.moveTo(canvas.width - 1, 0)
        ctx.lineTo(canvas.width - 1, canvas.height)
        ctx.stroke()

        // Drawing timestamps in between
        const convertMethod = globalClipDuration > 3600 ? convertSecondsToHours : convertSecondsToMinutes
        let withText = globalClipDuration < globalAudioDuration * 0.25

        let step = Math.floor(globalAudioDuration / 10 / 10) * 10
        if (step < 1){
            step = 1
        }

        // Draw 1st level
        for (let i=step; i < globalAudioDuration; i+=step){
            const timestampText = convertMethod(i)
            drawTimestamp(i, timestampText, 27, 14,true)
        }

        // Draw 2nd level
        step = step / 10
        let count = 0
        for (let i=step; i < globalAudioDuration; i+=step){
            //i = Math.round(i * 10) / 10
            count++
            if (count % 10 === 0 ) continue // This prevents the 2nd level timestamp from drawing over the already existing 1st level timestamp
            const timestampText = convertMethod(i)
            drawTimestamp(i, timestampText,15, 10,withText)
        }

        //Draw 3rd level
        if (globalClipDuration > globalAudioDuration * 0.025) return
        withText = globalClipDuration < globalAudioDuration * 0.01

        step = step / 10
        count = 0
        for (let i=step; i<globalAudioDuration; i+=step){
            //i = parseFloat(i.toFixed(0))
            i = (i * 10) / 10
            count++
            if (count % 10 === 0 ) continue
            const timestampText = convertMethod(i)
            drawTimestamp(i, timestampText,5, 8,withText)
        }

    }

    const drawTimestamp = (timestamp, timestampText, lineHeight, fontSize, withText) => {
        const canvas = timeAxisRef.current
        const ctx = timeAxisRef.current.getContext('2d')
        const x = (timestamp * canvas.width / globalClipDuration) - ( currentStartTime * canvas.width / globalClipDuration )

        // Draw line under Timestamp text
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, lineHeight)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#9db4c0'
        ctx.stroke()

        // Draw timestamp text
        ctx.font = `${fontSize}px Arial`
        ctx.fillStyle = '#9db4c0'

        const textWidth = ctx.measureText(timestampText).width

        if (withText) {
            ctx.fillText(timestampText, x - textWidth / 2, lineHeight+12)
        }
    }

    const convertSecondsToMinutes = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000)

        const timeString = minutes.toString().padStart(2, '0') + ':' +
            Math.floor(remainingSeconds).toString().padStart(2, '0') + '.' +
            milliseconds.toString().padStart(1, '0')

        return timeString
    }

    const convertSecondsToHours = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        let remainingSeconds = seconds % 3600
        const minutes = Math.floor(remainingSeconds / 60)
        remainingSeconds %= 60
        const secondsStr = remainingSeconds.toFixed(0).padStart(2, '0')

        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsStr}`

        return timeString
    }

    const drawLine = (label, timestamp) => {
        const waveformCTX = waveformCanvasRef.current.getContext('2d')
        const specCTX = specCanvasRef.current.getContext('2d')
        const labelCTX = labelCanvasRef.current.getContext('2d')

        const x = calculateXPosition(timestamp, specCanvasRef.current)
        const y = calculateYPosition(label)

        const lineColor = getCorrectLabelColor(label)

        waveformCTX.beginPath()
        waveformCTX.setLineDash([1, 1])
        waveformCTX.moveTo(x, 0)
        waveformCTX.lineTo(x, waveformCanvasRef.current.height)
        waveformCTX.lineWidth = 2
        waveformCTX.strokeStyle = lineColor
        waveformCTX.stroke()
        waveformCTX.setLineDash([])

        specCTX.beginPath()
        specCTX.setLineDash([1, 1])
        specCTX.moveTo(x, 0)
        specCTX.lineTo(x, specCanvasRef.current.height)
        specCTX.lineWidth = 2
        specCTX.strokeStyle = lineColor
        specCTX.stroke()
        specCTX.setLineDash([])

        labelCTX.beginPath()
        labelCTX.setLineDash([1, 1])
        labelCTX.moveTo(x, 0)
        labelCTX.lineTo(x, y)
        labelCTX.lineWidth = 2
        labelCTX.strokeStyle = lineColor
        labelCTX.stroke()
        labelCTX.setLineDash([])
    }

    const drawLineBetween = (label) => {
        const cvs = labelCanvasRef.current
        const ctx = cvs.getContext('2d');

        const xOnset = calculateXPosition(label.onset, cvs)
        const xOffset = calculateXPosition(label.offset, cvs)
        const y = calculateYPosition(label)

        const lineColor = getCorrectLabelColor(label)

        ctx.lineWidth = 2
        ctx.strokeStyle = lineColor

        // Draw horizontal line
        ctx.beginPath()
        ctx.moveTo(xOnset, y)
        ctx.lineTo(xOffset, y)
        ctx.stroke()

        // Draw short Onset line
        ctx.beginPath()
        ctx.moveTo(xOnset, y - 3 )
        ctx.lineTo(xOnset, y + 1)
        ctx.stroke()

        // Draw short Offset line
        ctx.beginPath()
        ctx.moveTo(xOffset, y - 3 )
        ctx.lineTo(xOffset, y + 1)
        ctx.stroke()
    }

    const drawClustername = (label) => {
        const cvs = labelCanvasRef.current;
        const ctx = cvs.getContext('2d');

        const xClustername = ( calculateXPosition(label.onset, cvs) + calculateXPosition(label.offset, cvs) ) / 2
        const y = calculateYPosition(label)

        const lineColor = getCorrectLabelColor(label)

        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = lineColor
        ctx.fillText(label.individual + ' ' + label.clustername, xClustername, y - 4);
    }

    const drawAllLabels = () => {
        for (let label of labels) {
            // If a user sets an onset without offset, the onset line will be drawn until he sets an offset, so he doesn't forget about it:
            if (!label.offset){
                drawLine(label, label.onset)
            }
            // Draw label that is being dragged with extended lines and in a different color
            if (label === clickedLabel){
                drawLine(label, label.onset)
                drawLine(label, label.offset)
                drawLineBetween(label)
                drawClustername(label)
            // Draw all other labels like this
            } else {
                drawLineBetween(label)
            }
        }
    }

    const drawActiveLabel = () => {
        if (!activeLabel) return

        drawLine(activeLabel, activeLabel.onset)
        drawLine(activeLabel, activeLabel.offset)
    }


    /* ++++++++++++++++++ Label manipulation methods ++++++++++++++++++ */

    const addNewLabel = (onset) => {
        const newClustername = activeClusternameBTN? activeClusternameBTN.clustername: null
        setLabels(current => [...current, new Label(onset, undefined, newClustername, labelCanvasRef.current.height, activeIndividual) ])
    }

    const deleteLabel = (labelToBeDeleted) => {
        const filteredLabels = labels.filter(label => label !== labelToBeDeleted)
        setLabels(filteredLabels)
    }

    const flipOnsetOffset = (label) => {
        const newOnset = label.offset
        const newOffset = label.onset

        label.onset = newOnset
        label.offset = newOffset

        return label
    }

    const updateOnset = (event) => {
        clickedLabel.onset = calculateTimestamp(event)
    }

    const updateOffset  = (event) => {
        clickedLabel.offset = calculateTimestamp(event)
    }

    const dragOnset = (event) => {
        const specCanvas = specCanvasRef.current
        const specCTX = specCanvas.getContext('2d')
        const waveformCanvas = waveformCanvasRef.current
        const waveformCTX = waveformCanvas.getContext('2d')

        updateOnset(event)

        specCTX.clearRect(0, 0, specCanvas.width, specCanvas.height)
        specCTX.putImageData(specImgData.current, 0, 0);

        waveformCTX.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        //drawPlayhead(playheadRef.current.timeframe)
    }

    const dragOffset = (event) => {
        const specCanvas = specCanvasRef.current
        const specCTX = specCanvas.getContext('2d')
        const waveformCanvas = waveformCanvasRef.current
        const waveformCTX = waveformCanvas.getContext('2d')

        updateOffset(event)

        specCTX.clearRect(0, 0, specCanvas.width, specCanvas.height)
        specCTX.putImageData(specImgData.current, 0, 0);

        waveformCTX.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height)
        waveformCTX.putImageData(waveformImgData.current, 0, 0)

        drawAllLabels()
        //drawPlayhead(playheadRef.current.timeframe)
    }

    const magnet = (timestamp) => {
        for (let label of labels){
            if (timestamp < label.onset + ZERO_GAP_CORRECTION_MARGIN && timestamp > label.onset - ZERO_GAP_CORRECTION_MARGIN){
                return label.onset
            }
            if (timestamp < label.offset + ZERO_GAP_CORRECTION_MARGIN && timestamp > label.offset - ZERO_GAP_CORRECTION_MARGIN){
                return label.offset
            }
        }
        return timestamp
    }


    /* ++++++++++++++++++ Overview Bar Methods ++++++++++++++++++ */

    const handleLMBDownOverview = (event) => {
        const xClicked = getXClicked(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + globalClipDuration)

        // Deal with click on Start Frame
        if (xClicked >= xStartFrame - 2 && xClicked <= xStartFrame + 2){
            overviewRef.current.style.cursor = 'col-resize'
            overviewRef.current.addEventListener('mousemove', dragStartFrame)
            //overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
            return
        }

        // Deal with click on End Frame
        if (xClicked >= xEndFrame - 2 && xClicked <= xEndFrame + 2){
            overviewRef.current.addEventListener('mousemove', dragEndFrame)
            //overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
            return
        }

        // Deal with click inside viewport
        if (xClicked > xStartFrame && xClicked < xEndFrame){
            const xStartTime = calculateViewportFrameX(currentStartTime)
            const xCurrentEndTime = calculateViewportFrameX(currentEndTime)
            widthBetween_xStartTime_xClicked = xClicked - xStartTime
            widthBetween_xEndTime_xClicked = xCurrentEndTime - xClicked
            overviewRef.current.addEventListener('mousemove', dragViewport)
            overviewRef.current.addEventListener('mouseleave', handleMouseUpOverview)
        }
    }

    const handleMouseUpOverview = (event) => {
        if (event.button !== 0) {
            return
        }

        overviewRef.current.removeEventListener('mousemove', dragStartFrame)
        overviewRef.current.removeEventListener('mousemove', dragEndFrame)
        overviewRef.current.removeEventListener('mousemove', dragViewport)
        overviewRef.current.removeEventListener('mouseleave', handleMouseUpOverview)

        // Set new Viewport (Start & Endframe)
        if (widthBetween_xStartTime_xClicked){
            const newDuration = newViewportEndFrame - newViewportStartFrame
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            passCurrentStartTimeToApp( newViewportStartFrame )
            passCurrentEndTimeToApp( newViewportEndFrame )
            passClipDurationToApp( newDuration )
            passMaxScrollTimeToApp( newMaxScrollTime )
            passScrollStepToApp(newDuration * SCROLL_STEP_RATIO)
        // Set new Start Frame
        } else if (newViewportStartFrame){
            const newDuration = currentEndTime - newViewportStartFrame
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            passCurrentStartTimeToApp(newViewportStartFrame)
            passClipDurationToApp( newDuration )
            passMaxScrollTimeToApp( newMaxScrollTime )
            passScrollStepToApp(newDuration * SCROLL_STEP_RATIO);
        // Set new End frame
        } else if (newViewportEndFrame){
            const newDuration = newViewportEndFrame - currentStartTime
            const newMaxScrollTime = Math.max(globalAudioDuration - newDuration, 0)
            passCurrentEndTimeToApp( newViewportEndFrame )
            passClipDurationToApp( newDuration )
            passMaxScrollTimeToApp( newMaxScrollTime )
            passScrollStepToApp(newDuration * SCROLL_STEP_RATIO);
        }

        newViewportStartFrame = null
        newViewportEndFrame = null
        widthBetween_xStartTime_xClicked = null
        widthBetween_xEndTime_xClicked = null
    }

    const dragStartFrame = (event) => {
        const xClicked = getXClicked(event)
        newViewportStartFrame = calculateViewportTimestamp(xClicked)
        drawViewport(newViewportStartFrame, currentEndTime, 'white', 2)
    }

    const dragEndFrame = (event) => {
        const xClicked = getXClicked(event)
        newViewportEndFrame = calculateViewportTimestamp(xClicked)
        drawViewport(currentStartTime, newViewportEndFrame, 'white', 2)
    }

    const dragViewport = (event) => {
        const xClicked = getXClicked(event)
        const viewportWidth = widthBetween_xStartTime_xClicked + widthBetween_xEndTime_xClicked
        newViewportStartFrame = calculateViewportTimestamp(xClicked - widthBetween_xStartTime_xClicked)
        newViewportEndFrame = calculateViewportTimestamp(xClicked + widthBetween_xEndTime_xClicked)
        // Prevent Viewport Start Frame from going below 0
        if (newViewportStartFrame < 0){
            newViewportStartFrame = 0
            newViewportEndFrame = calculateViewportTimestamp( viewportWidth )
            return
        }
        // Prevent Viewport End Frame from going above the Audio Duration
        if (newViewportEndFrame > globalAudioDuration){
            newViewportStartFrame = calculateViewportTimestamp(overviewRef.current.width - viewportWidth )
            newViewportEndFrame = globalAudioDuration
            return
        }
        drawViewport(newViewportStartFrame, newViewportEndFrame, 'white', 4)
    }

    const calculateViewportTimestamp = (xClicked) => {
        return globalAudioDuration * (xClicked / overviewRef.current.width)
    }

    const calculateViewportFrameX = (timestamp) => {
        return timestamp * overviewRef.current.width / globalAudioDuration
    }

    const updateViewportScrollButtons = (startFrame, endFrame) => {
        const leftScrollBtn = document.getElementById('left-scroll-overview-btn')
        const rightScrollBtn = document.getElementById('right-scroll-overview-btn')
        const xLeftBtn = calculateViewportFrameX(startFrame) + 185
        const xRightBtn = calculateViewportFrameX(endFrame) + 205
        leftScrollBtn.style.left = `${xLeftBtn}px`
        rightScrollBtn.style.left = `${xRightBtn}px`
    }

    const drawViewport = (startFrame, endFrame, hexColorCode, lineWidth) => {
        const overviewCanvas = overviewRef.current
        const ctx = overviewCanvas.getContext('2d');
        ctx.clearRect(0, 0, overviewCanvas.width, overviewCanvas.height);

        // Draw horizontal line representing the audio track
        ctx.lineWidth = 2
        ctx.strokeStyle = '#b6b1ff'
        ctx.beginPath()
        ctx.moveTo(0, 5)
        ctx.lineTo(overviewCanvas.width, 5)
        ctx.stroke()

        const x1 = calculateViewportFrameX(startFrame)
        const x2 = calculateViewportFrameX(endFrame)
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = hexColorCode

        // Draw start frame
        ctx.beginPath()
        ctx.moveTo(x1, 0)
        ctx.lineTo(x1, overviewCanvas.height)
        ctx.stroke()

        // Draw end frame
        ctx.beginPath()
        ctx.moveTo(x2, 0)
        ctx.lineTo(x2, overviewCanvas.height)
        ctx.stroke()

        // Draw Top line
        ctx.beginPath()
        ctx.moveTo(x1, 0)
        ctx.lineTo(x2, 0)
        ctx.stroke()

        // Draw Bottom line
        ctx.beginPath()
        ctx.moveTo(x1, overviewCanvas.height)
        ctx.lineTo(x2, overviewCanvas.height)
        ctx.stroke()

        // Draw Viewport Timestamps
        ctx.font = `10px Arial`;
        ctx.fillStyle = hexColorCode
        const timestampText = (Math.round(startFrame * 100) / 100).toString()
        ctx.fillText(timestampText, x1 + 5, overviewCanvas.height-5);

        // Update Scroll Button positions
        updateViewportScrollButtons(startFrame, endFrame)
    }

    const handleMouseMoveOverview = (event) => {
        hoverViewportFrame(event)
    }

    const hoverViewportFrame = (event) => {
        const xHovered = getXClicked(event)
        const xStartFrame = calculateViewportFrameX(currentStartTime)
        const xEndFrame = calculateViewportFrameX(currentStartTime + globalClipDuration)

        // Deal with click on Start Frame
        if ( (xHovered >= xStartFrame - 2 && xHovered <= xStartFrame + 2) || (xHovered >= xEndFrame - 2 && xHovered <= xEndFrame + 2) ){
            overviewRef.current.style.cursor = 'col-resize'
        } else {
            overviewRef.current.style.cursor = 'default'
        }
    }

    const leftScrollOverview = () => {
        passCurrentStartTimeToApp(
            prevStartTime => Math.max(prevStartTime - globalClipDuration, 0)
        );
        passCurrentEndTimeToApp(
            prevEndTime => Math.max(prevEndTime - globalClipDuration, globalClipDuration)
        );
    }

    const rightScrollOverview = () => {
        passCurrentStartTimeToApp(
            prevStartTime => Math.min(prevStartTime + globalClipDuration, maxScrollTime)
        );
        passCurrentEndTimeToApp(
            prevEndTime => Math.min(prevEndTime + globalClipDuration, globalAudioDuration)
        );
    }

    /* ++++++++++++++++++ Audio methods ++++++++++++++++++ */
    const getAudio = async () => {
        setAudioSnippet(null)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-wav'
        try {
            const response = await axios.post(path, {
                audio_id: audioId,
                start_time: currentStartTime,
                clip_duration: globalClipDuration
            });
            handleNewAudio(response.data.wav);
        } catch (error) {
            console.error("Error fetching audio clip:", error);
        }
    };

    const handleNewAudio = (newAudioBase64String) => {
        const audio = new Audio(`data:audio/ogg;base64,${newAudioBase64String}`);
        setAudioSnippet(audio)
    }

    const playAudio = () => {
        audioSnippet.play()
        loop()
    }

    function loop(){
        if (audioSnippet.paused) return

        const canvas = specCanvasRef.current
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(specImgData.current, 0, 0);
        drawAllLabels()
        drawPlayhead(currentStartTime + audioSnippet.currentTime)

        window.requestAnimationFrame(() => loop() )
    }

    const pauseAudio = () => {
        if (!audioSnippet) return
        audioSnippet.pause()
        updatePlayhead(currentStartTime + audioSnippet.currentTime)
    }

    const stopAudio = () => {
        if (!audioSnippet) return

        audioSnippet.pause()
        audioSnippet.currentTime = currentStartTime
        updatePlayhead(currentStartTime)

        const canvas = specCanvasRef.current
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(specImgData.current, 0, 0);
        drawAllLabels()
    }

    const drawPlayhead = (timeframe) => {
        const canvas = specCanvasRef.current
        const ctx = canvas.getContext('2d');
        const x = calculateXPosition(timeframe, canvas)

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.lineWidth = 2
        ctx.strokeStyle = "red"
        ctx.stroke()
    }

    const updatePlayhead = (newTimeframe) => {
        playheadRef.current.timeframe = newTimeframe
    }


    /* ++++++++++++++++++ Waveform ++++++++++++++++++ */
    const getAudioArray = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-audio-clip-for-visualization'
        const requestParameters = {
            audio_id: audioId,
            start_time: currentStartTime,
            clip_duration: globalClipDuration,
            target_length: 100000
        }

        const response = await axios.post(path, requestParameters);
        return response.data.wav_array
    };

    const drawWaveform = (newAudioArray) => {
        if (!waveformCanvasRef.current) return
        const canvas = waveformCanvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
        canvas.width = parent.innerWidth - 200

        const centerY = canvas.height / 2
        const ratio = Math.min((response.data.audio_duration - currentStartTime) / globalClipDuration, 1)
        ctx.strokeStyle = '#ddd8ff'

        for (let i=0; i < newAudioArray.length; i++) {
            const datapoint = newAudioArray[i]
            const y = centerY + waveformScale * datapoint

            ctx.beginPath()
            ctx.moveTo(i * canvas.width * ratio / newAudioArray.length, y)
            ctx.lineTo((i + 1) * canvas.width * ratio / newAudioArray.length, centerY + waveformScale * newAudioArray[i + 1])
            ctx.stroke()
        }

        // Draw flat line representing silence
        ctx.beginPath()
        ctx.moveTo(canvas.width * ratio ,centerY)
        ctx.lineTo(canvas.width, centerY)
        ctx.stroke()

        waveformImgData.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

     const waveformZoomIn = () => {
        setWaveformScale(prevState => prevState + 10)
     }

     const waveformZoomOut = () => {
         setWaveformScale(prevState => Math.max(prevState - 10, 1))
     }


    /* ++++++++++++++++++ Tracks ++++++++++++++++++ */

    const handleRemoveTrack = () => {
        if (response){
            deletePreviousTrackDurationInApp( response.data.audio_duration )
        }
        removeTrackInApp(id)
    }

    /* ++++++++++++++++++ Editor Container ++++++++++++++++++ */
    const handleMouseLeave = () => {
        const lastLabel = labels[labels.length -1]
        if (lastLabel && !lastLabel.offset){
            deleteLabel(lastLabel)
            passActiveLabelToApp(null)
        }
    }

    /* ++++++++++++++++++ Frequencies Axis ++++++++++++++++++ */
    const drawFrequenciesAxis = (frequenciesArray) => {
        if (!frequenciesCanvasRef.current) return

        const cvs = frequenciesCanvasRef.current
        const ctx = cvs.getContext('2d', { willReadFrequently: true, alpha: true })
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        ctx.strokeStyle = '#ffffff'
        ctx.fillStyle = '#ffffff'
        ctx.lineWidth = 1.5

        // Calculate the index distance to select 5 frequencies between the first and last value
        const indexDistance = Math.floor((frequenciesArray.length - 2) / 6)

        // Initialize the indices array with the indices of the selected frequencies
        let indices = [0] // Include the first frequency
        for (let i = 1; i <= 5; i++) {
            indices.push(i * indexDistance)
        }
        indices.push(frequenciesArray.length - 1) // Include the last frequency

        // Get the frequencies at the selected indices
        const selectedFrequencies = indices.map(index => frequenciesArray[index])

        // Draw the frequencies
        const lineDistance = cvs.height / selectedFrequencies.length
        let y = cvs.height
        for (let freq of selectedFrequencies){
            ctx.beginPath()
            ctx.moveTo(33,y)
            ctx.lineTo(40, y)
            ctx.stroke()
            ctx.fillText(`${Math.round(freq / 10) * 10}`, 0, y);
            y -= lineDistance
        }

        ctx.fillText('Hz', 0, 10);
    }


    /* ++++++++++++++++++ Whisper ++++++++++++++++++ */
    const callWhisperSeg = async () => {
        setWhisperSegIsLoading(true)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-labels'
        const requestParameters = {
            audio_id: audioId,
        }

        const response = await axios.post(path, requestParameters)

        //return response.data
        const whisperObjects = response.data.labels

        const whisperLabels = whisperObjects.map( obj => new Label(obj.onset, obj.offset, obj.clustername, labelCanvasRef.current.height, activeIndividual))

        setLabels(prevState => [...prevState, ...whisperLabels] )
        setWhisperSegIsLoading(false)
    }

    const byURL = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'upload-by-url'
        const requestParameters = {
            //audio_url: 'https://storage.googleapis.com/callbase_bucket/XC633481-RFW_.mp3?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=callbase-storage-management%40callbase-395411.iam.gserviceaccount.com%2F20240222%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20240222T135207Z&X-Goog-Expires=604800&X-Goog-SignedHeaders=host&X-Goog-Signature=171057da4032d1ee38946369ab9b0bd090539b7d258c7fb1f9b057120b5e6ed9bcdb9f585d0648852e78b10baee07882f813e1278d227dad2b17f0410ae91e4c0a472210485a8d085c6ffa0f3ddfe7f038fee2c9d0089b0980d44ea00cf32d58542bbca37f2bf0cfccc1220ee26ce242340f2fbc238f9b8c0d85bc4d4e975d926e93c58313bc60bb0d40620dfaaeea85068d17282a2e94c7dae6d87b4eb88ffd8794c53a41e936e94df8f59bf28d76dc7042671053fb80f95a94ad2e60bf168784941c52dcbeef7b4575d15649a971e968b8b934f2eba5a2f4862a35727b75d76b7d672791cfc1837a32cd421e80b016722e446bc8b981a0fdd548636fdc8843',
            audio_url: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'
        }

        const response = await axios.post(path, requestParameters)

        console.log(response.data)
    }


    /* ++++++++++++++++++ UseEffect Hooks ++++++++++++++++++ */

    // When labels or the Waveform Scale value are manipulated
    useEffect(() => {
        if (!spectrogram) return
        drawEditorCanvases(spectrogram, frequencies,audioArray)

    }, [labels, activeLabel, waveformScale, activeClusternameBTN, numberOfIndividuals])

    // When user zoomed, scrolled, or changed a parameter
    useEffect( () => {
            if (!globalClipDuration || !response) return

            if (audioSnippet) {
                audioSnippet.pause()
                audioSnippet.currentTime = currentStartTime
            }

            getSpecAndAudioArray()
        }, [currentStartTime, globalClipDuration, audioId, parameters]
    )


    // When a new audio file is uploaded:
    useEffect( () => {
            if (!response) return

            setAudioId(response.data.audio_id)
            setLabels([])
            //playheadRef.current.timeframe = 0

        }, [response])

    // When a new CSV File was uploaded
    /*
    useEffect( () => {
        if (!importedLabels) return
        setLabels(importedLabels)
    }, [importedLabels])
    */

    // When a new audio snippet is returned from the backend
    useEffect( () => {
        if (!audioSnippet) return
        playAudio()
    }, [audioSnippet])

    // When globalAudioDuration is updated in the App component
    useEffect( () => {
        if (!globalAudioDuration || !response) return

        passClipDurationToApp(globalAudioDuration)
        passCurrentStartTimeToApp(0)
        passCurrentEndTimeToApp(globalAudioDuration)
        passMaxScrollTimeToApp(0)
        passScrollStepToApp(globalAudioDuration * SCROLL_STEP_RATIO)
        playheadRef.current.timeframe = 0

    }, [response, globalAudioDuration])

    return (
        <div
            className='editor-container'
            onMouseLeave={handleMouseLeave}
        >

            {showOverviewInitialValue && response &&
                <div className='overview-time-axis-container'>
                    <canvas
                        className='overview-canvas'
                        ref={overviewRef}
                        width={parent.innerWidth - 200}
                        height={40}
                        onMouseDown={handleLMBDownOverview}
                        onMouseUp={handleMouseUpOverview}
                        onContextMenu={(event) => event.preventDefault()}
                        onMouseMove={handleMouseMoveOverview}
                    />
                    <button
                        id='left-scroll-overview-btn'
                        onClick={leftScrollOverview}
                    />
                    <button
                        id='right-scroll-overview-btn'
                        onClick={rightScrollOverview}
                    />
                    <canvas
                        className='time-axis-canvas'
                        ref={timeAxisRef}
                        width={parent.innerWidth - 200}
                        height={40}
                        onContextMenu={(event) => event.preventDefault()}
                    />
                </div>
            }
            <div className='track-container'>
                <div className='side-window' >
                    <div className='track-controls'>
                        <FileUpload
                            passResponseToScalableSpec={passResponseToScalableSpec}
                            passSpectrogramIsLoadingToScalableSpec={passSpectrogramIsLoadingToScalableSpec}
                            passTrackDurationToApp={passTrackDurationToApp}
                            deletePreviousTrackDurationInApp={deletePreviousTrackDurationInApp}
                            previousAudioDuration={response? response.data.audio_duration : undefined}
                        />
                        <Export
                            audioFileName={'Example Audio File Name'}
                            labels={labels}
                        />
                        {id !== 'track_1' &&
                            <button
                                onClick={handleRemoveTrack}
                            >
                                Remove Track
                            </button>
                        }
                        <button
                            onClick={() => console.log(labels)}
                        >
                            Console log labels
                        </button>
                        <button
                            onClick={waveformZoomIn}
                        >
                            Enhance Waveform
                        </button>
                        <button
                            onClick={waveformZoomOut}
                        >
                            Decrease Waveform
                        </button>
                        <button
                            onClick={callWhisperSeg}
                        >
                            Call WhisperSeg
                        </button>
                        <div className='audio-controls'>
                            <button
                                onClick={getAudio}
                            >
                                ▶
                            </button>
                            <button
                                onClick={pauseAudio}
                            >
                                ⏸
                            </button>
                            <button
                                onClick={stopAudio}
                            >
                                ⏹
                            </button>
                        </div>
                        <Parameters
                            passParametersToScalableSpec={passParametersToScalableSpec}
                        />
                    </div>
                    <canvas
                        className='frequencies-canvas'
                        ref={frequenciesCanvasRef}
                        width={40}
                        height={175}
                    />
                </div>

                <div onMouseLeave={handleMouseUp}>
                    <canvas
                        className='waveform-canvas'
                        ref={waveformCanvasRef}
                        width={parent.innerWidth - 200}
                        height={80}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    <canvas
                        className='spec-canvas'
                        ref={specCanvasRef}
                        width={parent.innerWidth - 200}
                        height={150}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    <canvas
                        className='label-canvas'
                        ref={labelCanvasRef}
                        width={parent.innerWidth - 200}
                        height={numberOfIndividuals * 20}
                        onMouseDown={handleLMBDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleRightClick}
                        onMouseMove={handleMouseMove}
                    />
                    {spectrogramIsLoading || whisperSegIsLoading? <Box sx={{ width: '100%' }}><LinearProgress /></Box> : ''}
                </div>

            </div>
        </div>
    );
}

export default ScalableSpec;