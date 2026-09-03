if (import.meta.env.DEV) {
	var _consoleError = console.error

	var _ignorePatterns = [
		"is unrecognized in this browser"
	]

	console.error = function(){
		try{
			var first = arguments[0]

			if(typeof first == "string"){
				for(var i = 0; i < _ignorePatterns.length; i++){
					if(first.indexOf(_ignorePatterns[i]) > -1){
						return
					}
				}
			}
		}catch(err){

		}

		return _consoleError.apply(console, arguments)
	}
}