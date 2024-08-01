(function() {
	if(window.localStorage.verify){
		$('.guide').remove()
	}else{
		var $skip = $('.guide .skip')

		var current = 0

		var $steps = $('.guide .steps')
			$skip.on({
				click : function(e){
					$("oauth").addClass("on")
					$("oauth forms").removeClass("loading")
				}
			})

			$steps.touchSlider({
				roll:false,
				resize:true,
				transition:false,
				initComplete: function(e) {
					
				},
				counter: function(e) {
					console.log(e)

					var $next = $(this).find(".ts-next")

					// $('.guide .steps')

					if(e.total == e.current){
						$next.text("confirm")

						if(current == e.current){
							$("oauth").addClass("on")
							$("oauth forms").removeClass("loading")
						}
					}else{
						$next.text("next")
					}

					current = e.current
				}
			})
	}
		



	OAuth3.on("ready", function(){
		OAuth3.Origin = ""

		var cc_url = window.location.origin

		if(OAuth3.localhost){
			cc_url = "http://"+OAuth3.localhost
		}

		// 메뉴 & 멤버 조회
		var request = {
			method : "GET",
			query : {
				cc : cc_url
			}
		}
		
		// 값 받기
		var response = function(res){
			console.log(res)

			var cookies = JSON.parse(res.body.cookies)

			if(!OAuth3.hash && cookies.hash){
				OAuth3.hash = cookies.hash
			}
			
			if(cookies.email){
				window.location.href = "/"
			}
			
			var rows = res.body.rows

			var target = document.querySelector("sitemap")

			var len = rows.length

			var limit = rows.limit

			var teams = {}

			for(var f = 0; f < len; f++){
				var row = rows[f]

				teams[row.From] = row
			}

			var $loading = document.querySelector(".loading")
				$loading.className = ""
			
			OAuth3.teams = teams

			var host = window.location.host

			if(OAuth3.localhost){
				host = OAuth3.localhost
			}

			if(OAuth3.isMobile){
				var $a = document.querySelector('a[href="javascript:Email(\'phone\')"]')
					$a.textContent = "인증"
				
				document.querySelector('.main oauth forms .title span').innerHTML = '메일 전송 후<br>인증확인 버튼을 눌러주세요'
			}else{
				var to = encodeURIComponent(host+"/#"+cookies.hash+"@oauth.email")

				var mailto = "mailto:"+to

				document.querySelector("qr").innerHTML = '<a target="_blank" href="'+mailto+'" class="qr-code"></a>'

				var $qrcode = document.querySelector(".qr-code")

				new QRCode($qrcode, {
					text: mailto,
					width: 300,
					height: 300,
					colorDark : "#000000",
					colorLight : "#ffffff",
					correctLevel : QRCode.CorrectLevel.H
				})
			}
		}

		OAuth3.fetch(request, response)
	})
})()

function Email(compose){
	var mailto = ""

	var host = window.location.host

	if(OAuth3.localhost){
		host = OAuth3.localhost
	}

	var to = encodeURIComponent(host+"/#"+OAuth3.hash+"@oauth.email")

	if(compose == "phone"){
		mailto = "mailto:"+to

		if(OAuth3.isMobile){
			
		}else{
			mailto = ""
		}
	}else if(compose == "naver"){
		mailto = "https://mail.naver.com/write/?cmd=compose&to="+to
	}else if(compose == "daum"){
		mailto = "https://mail.daum.net/hanmail/mail/MailComposeFrame.daum?TO="+to+"#?composer"
	}else if(compose == "nate"){
		mailto = "https://mail3.nate.com/#write/?act=new&to="+to
	}else if(compose == "google"){
		mailto = "https://mail.google.com/mail/?view=cm&fs=1&to="+to+"&su=&body="
	}else if(compose == "apple"){
		mailto = "https://www.icloud.com/message/current/ko-kr/index.html#compose?to="+to
	}else{
		mailto = "mailto:"+to
	}

	var _fetch

	var request = {
		method : "GET",
		count : 100,
		url : OAuth3.host,
		delay : 3000
	}

	if(mailto){
		request.mailto = mailto

		if(compose){
			request.compose = compose
		}
	}

	if(compose == "phone"){
		request.query = {}
	}

	var $loading = document.querySelector("forms")
		$loading.className = "loading mailto"

	var deviceCompose = "메일 앱"

	var $verify = document.querySelector("forms .verify")
		$verify.innerHTML = '인증 진행중'

	// 값 받기
	var response = function(res){
		var rows = res.body.rows

		var date = new Date()
		var len = rows.length

		var limit = rows.limit
		var To = ""
		var table = {}

		var cookies = JSON.parse(res.body.cookies)

		if(OAuth3.hash != cookies.hash){
			window.location.reload()
		}

		if(cookies.email){
			_fetch.abort()

			OAuth3.opener ? OAuth3.opener.close() : ""

			$loading.className = "complete"

			var $title = document.querySelector("forms .title")
				$title.innerHTML = '<p>인증완료</p>'

			var uri = new URL(document.URL)

			var href = document.referrer ? document.referrer : "/"

			window.localStorage.verify = "true"

			window.location.href = href
		}
	}

	_fetch = OAuth3.fetch(request, response)
}