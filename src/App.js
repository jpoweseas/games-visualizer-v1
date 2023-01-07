import axios from 'axios'

import logo from './logo.svg'
import './App.css'

import { useState, useEffect } from "react"

const getInitState = (data) => {
    return { recievedRoot : true, path : [data.root], nodes : data }
}

const getId = (rawId, parentId) => {
    /* const history = state.path.slice(0, pathIndex + 1).join('|') */
    return `${parentId}|${rawId}`
}

const getData = (state, id) => {
    if (!state.nodes[id]) {
        console.log('uh oh', id)
    }
    return state.nodes[id]
}

const getChildren = (state, parentId) => {
    const x = state.nodes[parentId].children.map(rawId => getId(rawId, parentId))
    return x
}

const getNodeType = (state, id) => {
    const { gameState, _ } = getData(state, id);
    if ([].concat(...gameState).filter((cell) => cell === '.').length % 2 === 0) {
        return 'A'
    } else {
        return 'B'
    }
}

/*
 * const getNodeType = (state, id) => {
 *     const { gameState, _ } = getData(state, id);
 *     if (gameState.filter((cell) => cell === ' ').length % 2 === 0) {
 *         return 'B'
 *     } else {
 *         return 'A'
 *     }
 * }
 *  */

/* const getNodeType = (state, id) => {
 *     const { gameState, _ } = getData(state, id);
 *     return gameState.slice(0, -1)
 * }
 *  */

const isOnDisplayedPath = (state, id) => {
    const ret = state.path.includes(id)
    return ret
}

const getClass = (state, id) => {
    const nodeType = getNodeType(state, id)
    const prefix = nodeType === 'A' ? 'a-' : (nodeType === 'B' ? 'b-' : '');
    const suffix = isOnDisplayedPath(state, id) ? 'selected' : 'turn'
    return (prefix + suffix)
}

const getInterText = (state, id) => {
    const prefix = getNodeType(state, id)
    return `${prefix} TURN`
}

const setLeaf = (state, setState, id) => {
    if (id === state.path[0]) {
        setState({ path : [id], recievedRoot : state.recievedRoot, nodes : state.nodes })
    } else {
        const new_path = []
        state.path.every(path_id => {
            if (getChildren(state, path_id).includes(id)) {
                new_path.push(path_id)
                new_path.push(id)
                return false
            } else {
                new_path.push(path_id)
                return true
            }
        })
        setState({ path : new_path, recievedRoot : state.recievedRoot, nodes : state.nodes })
    }
}

/* const GameStateDisplay = ({ gameState }) => {
 *     return (
 *         <div>
 *             |{gameState.slice(35,42).join('')}|
 *         <br></br>
 *             |{gameState.slice(28,35).join('')}|
 *         <br></br>
 *             |{gameState.slice(21,28).join('')}|
 *         <br></br>
 *             |{gameState.slice(14,21).join('')}|
 *         <br></br>
 *             |{gameState.slice(7,14).join('')}|
 *         <br></br>
 *             |{gameState.slice(0,7).join('')}|
 *         </div>
 *     )
 * }
 *  */
const GameStateDisplay = ({ gameState }) => {
    return (
        <div>
        |{[...Array(7).keys()].map(i => gameState[i][5]).join('')}|
            <br></br>
        |{[...Array(7).keys()].map(i => gameState[i][4]).join('')}|
            <br></br>
        |{[...Array(7).keys()].map(i => gameState[i][3]).join('')}|
            <br></br>
        |{[...Array(7).keys()].map(i => gameState[i][2]).join('')}|
            <br></br>
        |{[...Array(7).keys()].map(i => gameState[i][1]).join('')}|
        <br></br>
        |{[...Array(7).keys()].map(i => gameState[i][0]).join('')}|
        </div>
    )
}


/* const GameStateDisplay = ({ gameState }) => {
 *     return (
 *         <div>
 *             {gameState.slice(0,3).join('|')}
 *             <br></br>-----<br></br>
 *             {gameState.slice(3,6).join('|')}
 *             <br></br>-----<br></br>
 *             {gameState.slice(6,9).join('|')}
 *         </div>
 *     )
 * }
 *  */

/* const GameStateDisplay = ({ gameState }) => {
 *     return (
 *         <div>
 *             Node {gameState}
 *         </div>
 *     )
 * }
 *  */

const Node = ({ id, state, setState }) => {
    const { gameState, score, children, init_alpha, init_beta, init_lb, init_ub } = getData(state, id);
    const className = getClass(state, id)
    return (
        <div
            className={className}
            style={{display : "table-cell"}}
            onClick={() => setLeaf(state, setState, id)}
        >
            <GameStateDisplay gameState={gameState} key={`gamestate-${id}`}> </GameStateDisplay>
            <div>Score: {score}</div>
            <div>Init A/B: {init_alpha},{init_beta}</div>
            <div>Init L/U: {init_lb},{init_ub}</div>
        </div>);
}

const Row = ({ ids, state, setState }) => {
    return (
        <div style={{display : "table"}}>
            <div style={{display : "table-row"}} >
                { ids.map((child) =>
                    <Node
                        key={`node-${child}`}
                        id={child}
                        state={state}
                        setState={setState}
                    > </Node>)}
            </div>
        </div>
    )
}

const Inter = ({ state, parentId }) => {
    const className = getClass(state, parentId)
    const text = getInterText(state, parentId)
    return (<div className={className}><span>{text}</span></div>)
}


const App = () => {
    const [state, setState] = useState({})

    useEffect(()=>{
        if (!state.recievedRoot) {
            axios.get('http://localhost:5000/test').then(response => {
                console.log(response.data)
                setState(getInitState(response.data))
            }).catch(error => {
                console.log(error)
            })
        }
    }, [])

    if (!state.recievedRoot) {
        return <span>Waiting on server...</span>
    } else {
        let parentId = null;
        return (
            <div className="App">
                <Row ids={[state.path[0]]}
                     key={`root`}
                     state={state}
                     setState={setState}
                > </Row>
                {
                    state.path.map((parentId, pathIndex) => {
                        const children = getChildren(state, parentId);
                        const nodeType = getNodeType(state, parentId);
                        return (
                            <div>
                                {children.length === 0 ? (<div></div>) :
                                 (<Inter
                                      parentId={parentId}
                                      state={state}
                                      key={`inter-${parentId}`}
                                  > </Inter>)
                                }
                                <Row
                                    ids={children}
                                    key={`row-${parentId}`}
                                    state={state}
                                    setState={setState}
                                >
                                </Row>
                            </div>
                        )
                    })
                }
            </div>
        );
    }
}

export default App;
