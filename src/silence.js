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
	/*
		개발 Part 16 (외부 주입 스크립트)
		Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
		    at et.reportAllChanges (<anonymous>:2:19429)
		위 예외는 web-vitals 계측기가 LCP/INP 엔트리가 비어 있는 프레임에서
		entries[0].startTime 을 읽어 발생한다.
		reportAllChanges 는 web-vitals 의 옵션 프로퍼티명이며
		memepoly 소스 어디에도 존재하지 않는다.
		<anonymous> / VM 접두 파일명은 eval 또는 확장 프로그램 주입을 뜻한다.
		우리 코드에서 잡을 방법이 없고 동작에도 영향이 없으므로
		"파일명이 없는 예외" 만 걸러 콘솔을 비운다.
		파일명이 있는 예외(우리 번들)는 절대 삼키지 않는다.
	*/
	var _foreignPatterns = [
		"reportAllChanges",
		"web-vitals"
	]
	window.addEventListener("error", function(e){
		try{
			var filename = e.filename ? String(e.filename) : ""
			if(filename){
				return
			}
			var stack = ""
			if(e.error && e.error.stack){
				stack = String(e.error.stack)
			}
			var message = e.message ? String(e.message) : ""
			var hay = stack + " " + message
			for(var i = 0; i < _foreignPatterns.length; i++){
				if(hay.indexOf(_foreignPatterns[i]) > -1){
					e.preventDefault()
					e.stopImmediatePropagation()
					return
				}
			}
		}catch(err){
		}
	}, true)
}