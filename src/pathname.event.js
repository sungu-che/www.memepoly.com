function Tooltip(el){
	el.style.top = (typeof el.top == "number" ? el.top : -1000) +"px";
}


document.body.addEventListener('cut', function(e){
	var $this = e.target;
	var $form = $this.closest('form[name="oauth.network"]');

	if($form){
		if($this.tagName == "H0" || $this.tagName == "ITEM"){

		}else{
			e.preventDefault();
		}
	}
});

document.body.addEventListener('paste', function(e){
	var $this = e.target;
	var $form = $this.closest('form[name="oauth.network"]');

	if($form){
		if($this.tagName == "H0" || $this.tagName == "ITEM"){

		}else{
			e.preventDefault();
		}
	}
});

document.body.addEventListener('click', function(e){
	console.log(e);	
	var $this = e.target;
	var $form = $this.closest('form[name="oauth.network"]');
	
	if($form){
		var to = $form.getAttribute("to");
		var client = $form.getAttribute("client");
		var contenteditable = $form.getAttribute("contenteditable") ? true : false;
		
		var $details = $this.closest('details');
		
		if($details){
			if($this.type){
				console.log("$this.name",$this.name);
			}
			
			if($this.tagName = "A"){
				var href = window.location.href;

				if(OAuth3.localhost){
					href = "http://"+OAuth3.localhost+window.location.pathname+window.location.search;
				}

				if($this.href == href){
					e.preventDefault();
					
				}
			}
			// var $type = $details.querySelector('input[name="col_type"]');
			// var $date = $details.querySelector('input[name="col_date"]');

			// var $started = $details.querySelector('input[name="col_started"]');
			// var $expired = $details.querySelector('input[name="col_expired"]');


		}
	}
});	



document.body.addEventListener('click', function(e){
	var $this = e.target;
	var $form = $this.closest('form[name="oauth.network"]');

	var OAuth3 = document.querySelector('iframe[name="oauth.network"]');

	if($form){
		var draggable = false;
		var contenteditable = $form.getAttribute("contenteditable") ? true : false;
		
		var $field = $form.querySelector("field.on");
		var $fields = $form.querySelector("fields");
		
		var tooltip = document.querySelector('field[draggable="false"]');
		var _tooltip = $this.closest('tooltip');

		if(tooltip){
			if(window.location.search.length == 0){
				draggable = true;
			}

			if(contenteditable && draggable){
				// 어드민 영역
				var type = $this.getAttribute("type");


				if($form && !_tooltip){
					var $items = $form.querySelectorAll("item, h0");
					for(var i = 0; i < $items.length; i++){
						$items[i].classList.remove("on");
					}
				}

				if(type == "hide"){
					if($field.id){
						$field.innerHTML = "";

						if($field.id.indexOf("_") > -1){
							$field.className = "hide";
						}else{
							$field.outerHTML = "";
						}
					}else{
						$field.outerHTML = "";
					}

					Tooltip(tooltip);

					return;
				}

				if(type == "link" || type == "uri"){

					return;
				}

				if(type == "undo"){
					document.execCommand('undo', false, null);
				}

				if(type == "image"){
					try{
						// 모던 브라우저
						var $input = document.createElement("input");
							$input.type="file";
							$input.onchange = async function(event){
								const file = event.target.files[0];

								const options = {
									maxSizeMB: 4,
									maxWidthOrHeight: 1920,
									useWebWorker: true
								}

								try {
									const compressedFile = await imageCompression(file, options);

									$form.file.Blob = compressedFile;
									$form.file.style["background-image"] = 'url('+URL.createObjectURL(compressedFile)+')';

								} catch (error) {
									console.log(error);
								}
							}

							$input.click();
					}catch(err){
						// 레거시 브라우저
					}
					
					return;
				}else{
					tooltip.classList.remove("image_enable");
					delete $form.file;
				}

				if($this.closest('field[draggable="false"]')){
					if(type == "checkbox" || type == "radio"){
						var beforeElement = $form.querySelector("field.on+field");
						var afterElement = document.createElement("field");

						if(tooltip){
							afterElement.innerHTML = tooltip.innerHTML;
							var $toolbar = afterElement.querySelector("toolbar")
							if($toolbar){
								afterElement.querySelector("toolbar").outerHTML = "";
							}
							afterElement.id = crc32(new Date().getTime() + window.location.host + "field").toString(32).toUpperCase();



							// 세션 멤버십에 따라 설정
							afterElement.setAttribute("type", type);
							afterElement.setAttribute("draggable", "true");
							afterElement.setAttribute("contenteditable", "true");

							afterElement.querySelector('item:not(.'+type+')').outerHTML = "";
							afterElement.querySelector('item').setAttribute("draggable", true);

							afterElement.querySelector('item').id = crc32(new Date().getTime() + window.location.host + "item").toString(32).toUpperCase();

							$fields.insertBefore(afterElement, beforeElement);

							afterElement.click();
						}
					}
				}else{
					var type = $this.getAttribute("type");

					var $field = $this.classList.contains("field") ? $this.classList.contains("field") : $this.closest('field');

					if(_tooltip){

					}else{
						var $fields = $form.querySelectorAll("field");
						if($fields.length){
							for(var f = 0; f < $fields.length; f++){
								$fields[f].classList.remove("on");
								$fields[f].querySelector("tooltip").removeAttribute("style");
							}
						}
					}

					if($this.tagName == "H0" || $this.tagName == "ITEM"){
						_tooltip = $field.querySelector("tooltip");

						$form.file = $this;
						tooltip.classList.add("image_enable");

						$this.classList.add("on");

						var link =  $this.getAttribute('link');

						_tooltip.top = $this.offsetTop;
						_tooltip.$target = $this;

						var $url = _tooltip.querySelector('input[type="uri"]');
						var value = "";

						if($this.getAttribute("link")){
							value = $this.getAttribute("link");
						}

						if($url){
							$url.value = value;
						}

						Tooltip(_tooltip);
					}



					if($field){
						$field.classList.add("on");

						tooltip.top = $field.offsetTop + $field.offsetHeight;
						
						tooltip.setAttribute("idx",$field.id);
					}else{
						delete tooltip.top;
						tooltip.removeAttribute("idx");
					}

					Tooltip(tooltip);
				}
			}else{
				// client
				if($this.tagName == "ITEM"){
					var type = $this.getAttribute("type");
					var checked = $this.getAttribute("checked");
					
					if(type == "radio"){
						var $items = $this.closest('items');
						
						var $item = $items.querySelectorAll("item");
						
						for(var i = 0; i < $item.length; i++){
							$item[i].removeAttribute("checked");
						}
						
						$this.setAttribute("checked","checked");
					}else if(type == "checkbox"){
						if(checked){
							$this.removeAttribute("checked");
						}else{
							$this.setAttribute("checked","checked");
						}
					}
				}
			}
		}
		
		
		
	}
});

document.body.addEventListener('keydown', function(e){
	try{
		var OAuth3 = document.querySelector('iframe[name="oauth.network"]');

		var anchorNode = window.getSelection().anchorNode;

		var $this = anchorNode.parentNode;

		var $form = $this.closest('form[name="oauth.network"]');

		var startOffset = window.getSelection().getRangeAt(0).startOffset;

		if(e.keyCode == 46){
			// delete

			if($form){
				if(window.getSelection().anchorNode.length == startOffset){
					e.preventDefault();
				}

				if(!startOffset){
					if(anchorNode.tagName == "ITEM"){
						var index = Array.prototype.indexOf.call($this.children, anchorNode);

						var len = $this.children.length - 1;
						if(index == len){
							e.preventDefault();
						}
					}

					if(anchorNode.tagName == "H0"){
						e.preventDefault();
					}
				}
			}
		}

		if(e.keyCode == 8){
			// back

			if(!startOffset){
				if(anchorNode.tagName == "ITEM"){
					var index = Array.prototype.indexOf.call($this.children, anchorNode);

					if(!index){
						e.preventDefault();
					}
				}

				if($this.tagName == "H0" || anchorNode.tagName == "H0"){
					e.preventDefault();
				}
			}
		}

		if(e.keyCode == 13){
			// 빈값 상태에서 엔터 막기
			if(!startOffset){
				e.preventDefault();
			}

			if($this.tagName == "H0" || anchorNode.tagName == "H0"){
				e.preventDefault();
			}
		}
	}catch(err){
		// console.log("err",err);
	}

});

document.body.addEventListener('keyup', function(e){
	try{
		var OAuth3 = document.querySelector('iframe[name="oauth.network"]');

		var anchorNode = window.getSelection().anchorNode;

		var $this = anchorNode.parentNode;

		if(e.target.tagName == "INPUT"){
			anchorNode = e.target;
		}else if(anchorNode.tagName){
			$this = anchorNode;
		}else{
			anchorNode = $this;
		}

		var $form = $this.closest('form[name="oauth.network"]');

		var startOffset = window.getSelection().getRangeAt(0).startOffset;

		if($form){
			var $items = $form.querySelectorAll("item, h0");
			for(var i = 0; i < $items.length; i++){
				$items[i].classList.remove("on");
			}
		}

		if(e.keyCode == 13){
			if(!window.getSelection().anchorNode.length){
				var $br = $this.querySelectorAll("br");

				if($br.length){
					for(var b = 0; b < $br.length; b++){
						$br[b].outerHTML = "";
					}
				}
			}

			console.log(anchorNode);
			console.log(anchorNode.tagName);

			if(anchorNode.tagName){
				var $styleNode = document.querySelectorAll(anchorNode.tagName.toLocaleLowerCase()+'[style*=\''+anchorNode.style["background-image"]+'\']');

				if($styleNode.length > 1){
					anchorNode.removeAttribute("style");
				}


				var $linkNode = document.querySelectorAll(anchorNode.tagName.toLocaleLowerCase()+'[link=\''+anchorNode.getAttribute("link")+'\']');

				if($linkNode.length > 1){
					anchorNode.removeAttribute("link");
				}
			}


			var el = $form.querySelectorAll('[id="'+anchorNode.id+'"]');


			if(el.length > 1){
				var salt = new Date().getTime() + window.location.host;
				anchorNode.id = crc32(salt+anchorNode.id).toString(32).toUpperCase();
			}
		}

		if(e.keyCode == 8 || e.keyCode == 46){
			if(!window.getSelection().anchorNode.length){
				var $br = $this.querySelectorAll("br");

				if($br.length){
					for(var b = 0; b < $br.length; b++){
						$br[b].outerHTML = "";
					}
				}
			}
		}

		var tooltip = document.querySelector('field[draggable="false"]');

		if(tooltip){
			if($form){
				var type = anchorNode.getAttribute("type");
				var _tooltip = anchorNode.closest('tooltip');
				var $field = anchorNode.classList.contains("field") ? anchorNode.classList.contains("field") : anchorNode.closest('field');

				if(_tooltip){

				}else if($field){
					_tooltip = $field.querySelector("tooltip");
					var $fields = $form.querySelectorAll("field");
					if($fields.length){
						for(var f = 0; f < $fields.length; f++){
							$fields[f].classList.remove("on");
							$fields[f].querySelector("tooltip").removeAttribute("style");
						}
					}
				}


				$field.classList.add("on");

				tooltip.top = $field.offsetTop + $field.offsetHeight;

				if(type == "uri"){
					var $item = _tooltip.$target;

					if($item){	
						if(e.keyCode == 38 || e.keyCode == 40){
							if($item.getAttribute("link")){
								anchorNode.value = $item.getAttribute("link");
							}
						}else{
							$item.setAttribute("link", anchorNode.value);
						}
					}
				}


				if(anchorNode.tagName == "H0" || anchorNode.tagName == "ITEM"){
					$form.file = anchorNode;
					anchorNode.classList.add("on");

					_tooltip.$target = anchorNode;
					_tooltip.top = anchorNode.offsetTop;

					var $url = _tooltip.querySelector('input[type="uri"]');
					var value = "";

					if(anchorNode.getAttribute("link")){
						value = anchorNode.getAttribute("link");
					}

					if($url){
						$url.value = value;
					}

					Tooltip(_tooltip);
				}



				tooltip.top = $field.offsetTop + $field.offsetHeight;

				Tooltip(tooltip);



			}
		}
	}catch(err){
		console.log(err);
	}
});

var dragTagName = "";

document.body.addEventListener('dragstart', function(e){
	try{
		var el = e.target;

		if(el.draggable){
			console.log(el.tagName);
			dragTagName = el.tagName;
			if(el.tagName == "FIELD"){
				var tooltip = document.querySelector('field[draggable="false"]');
					tooltip.removeAttribute("style");

				el.classList.remove("on");
				el.classList.add('dragging');
			}else if(el.tagName == "ITEM"){
				el.classList.remove("on");
				el.classList.add('dragging');
			}
		}
	}catch(err){
		console.log("draggable err",err);
	}
});

document.body.addEventListener('dragend', function(e){
	try{
		var el = e.target;

		if(e.target.draggable){
			e.target.classList.remove('dragging');

			if(e.tagName == "FIELD"){
				e.target.click();
			}
		}
		dragTagName = "";
	}catch(err){

	}
});

document.body.addEventListener('dragover', function(e){
	try{
		var el = e.target;

		if(e.target.draggable){
			e.preventDefault();

			if(dragTagName == el.tagName){
				if(el.tagName == "FIELD"){
					var $fields = document.querySelector('form[name="oauth.network"] fields');
					const afterElement = getDragAfterElement($fields, e.clientY);
					const draggable = document.querySelector('.dragging');
					afterElement.classList.remove("on");
					$fields.insertBefore(draggable, afterElement);
				}else if(el.tagName == "ITEM"){
					const draggable = document.querySelector('.dragging');
					var $items = draggable.closest("items");
					const afterElement = getDragAfterElement($items, e.clientY);


					afterElement.classList.remove("on");
					$items.insertBefore(draggable, afterElement);
				}
			}
		}
	}catch(err){

	}
});

function getDragAfterElement(fields, y) {
	const draggableElements = [...fields.querySelectorAll('[draggable]:not(.dragging)')]

	return draggableElements.reduce((closest, child) => {
		const box = child.getBoundingClientRect() //해당 엘리먼트에 top값, height값 담겨져 있는 메소드를 호출해 box변수에 할당
		const offset = y - box.top - box.height / 2 //수직 좌표 - top값 - height값 / 2의 연산을 통해서 offset변수에 할당

		if (offset < 0 && offset > closest.offset) { // (예외 처리) 0 이하 와, 음의 무한대 사이에 조건
			return { offset: offset, element: child } // Element를 리턴
		} else {
			return closest
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element
};