import {useEffect, useState} from "react"
import { nanoid } from 'nanoid'

class ClusternameButton {
    constructor(id, clustername, isActive) {
        this.id = id
        this.clustername = clustername
        this.isActive = isActive
    }
}

function Clusternames( { passActiveClusternameToVisuals } ){
    const [newClustername, setNewClustername] = useState('')
    const [clusternameButtons, setClusternameButtons] = useState([])

    function handleChange(event){
        setNewClustername(event.target.value)
    }

    function updateClusternamesButtons(event){
        event.preventDefault()

        setClusternameButtons( deactivateAll() )

        setClusternameButtons(prevState =>
            [
                ...prevState,
                new ClusternameButton( nanoid(),newClustername, true )
            ])

        passActiveClusternameToVisuals(newClustername)

        setNewClustername('')
    }

    function deactivateAll(){
        return clusternameButtons.map(item => {
            return new ClusternameButton (item.id, item.clustername, false)
        })
    }

    function handleLMB(event){
        setClusternameButtons( activateButton(event.target) )
    }

    function activateButton(btn){
        const newClusternameButtons = deactivateAll()

        return newClusternameButtons.map(item => {
            if (item.id === btn.id){
                passActiveClusternameToVisuals(item.clustername)
                return new ClusternameButton (item.id, item.clustername, !item.isActive)
            }
            return new ClusternameButton (item.id, item.clustername, item.isActive)
        })
    }

    function handleRightClick(event){
        event.preventDefault()
        setClusternameButtons( deleteClusternameButton(event.target) )
    }

    function deleteClusternameButton(btn){
        return clusternameButtons.filter(item => item.id !== btn.id)
    }

    // Whenever user deletes the active Clustername Button, the last button in the state array becomes active
    useEffect( () => {
        for (let item of clusternameButtons){
            if (item.isActive){
                return
            }
        }

        const lastClusternameBtn = clusternameButtons[clusternameButtons.length - 1]
        setClusternameButtons( activateButton(lastClusternameBtn) )

    }, [JSON.stringify(clusternameButtons)])

    return (
        <div>
            <form onSubmit={updateClusternamesButtons}>
                <input
                    type='text'
                    value={newClustername}
                    placeholder='Add custom clustername'
                    onChange={handleChange}
                />
            </form>
            <div id='clustername-buttons-container'>
                {
                    clusternameButtons.map( data =>
                        <div
                            key={data.id}
                            id={data.id}
                            isactive={data.isActive.toString()}
                            onClick={handleLMB}
                            onContextMenu={handleRightClick}
                        >
                            {data.clustername}
                        </div>)
                }
            </div>
        </div>
    )
}

export default Clusternames

