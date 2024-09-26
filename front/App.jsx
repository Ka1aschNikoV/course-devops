const App = () => {

    const handleClick = () => {
        //Do stuff
        console.log("do stuff")
    }
    return(
        <div>
            <button onClick={handleClick}>CLICK ME</button>
        </div>
    )
}

export default App