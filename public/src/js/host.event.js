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




document.body.addEventListener('keydown', function(e){
	try{
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
		var flows = tooltip.querySelector("flows");

		if(tooltip){
			if($form){
				var type = anchorNode.getAttribute("type");
				var _tooltip = anchorNode.closest('tooltip');
				var _flows;
				var $field = anchorNode.classList.contains("field") ? anchorNode.classList.contains("field") : anchorNode.closest('field');

				if(_tooltip){

				}else if($field){
					_tooltip = $field.querySelector("tooltip");
					var $fields = $form.querySelectorAll('field[contenteditable="true"]');
					if($fields.length){
						for(var f = 0; f < $fields.length; f++){
							$fields[f].classList.remove("on");
							$fields[f].querySelector("tooltip").removeAttribute("style");
							$fields[f].querySelector("flows").innerHTML = "";
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
								anchorNode.value = $item.textContent;
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

					_flows = _tooltip.querySelector("flows");

					var $url = _tooltip.querySelector('input[type="uri"]');
					var value = "";

					if(anchorNode.getAttribute("link")){
						console.log("anchorNode",anchorNode);
						value = anchorNode.textContent;
					}

					$url.value = value;

					Tooltip(_tooltip);

					if(anchorNode.tagName == "ITEM"){
						_flows.body = flows.innerHTML;
					}else{
						_flows.body = "";
					}
				}

				if(_flows){
					var _url = _tooltip.querySelector('input[type="uri"]');

					if(_flows.body){
						_flows.innerHTML = _flows.body;


						var $flowElements = _flows.querySelectorAll('flow');
						var $itemElements = $field.querySelectorAll('item');

						for(var f = 0; f < $flowElements.length; f++){
							var $flowElement = $flowElements[f];

							for(var i = 0; i < $itemElements.length; i++){
								var $itemElement = $itemElements[i];

								if($itemElement.getAttribute("link")){
									if($itemElement.id == $flowElement.id){
										$flowElement.setAttribute("selected", true);
									}
								}
							}
						}
					}else{
						_flows.innerHTML = "";
					}
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

document.body.addEventListener('click', function(e){
	console.log(e);
	var $this = e.target;
	var $form = $this.closest('form[name="oauth.network"]');

	if($form){
		var contenteditable = $form.getAttribute("contenteditable") ? true : false;

		var $field = $form.querySelector("field.on");
		var $fields = $form.querySelector("fields");

		var tooltip = document.querySelector('field[draggable="false"]');
		var _tooltip = $this.closest('tooltip');

		var flows = tooltip.querySelector("flows");
		var _flows;

		if(tooltip){
			if(contenteditable){
				// 어드민 영역
				var type = $this.getAttribute("type");

				if(type == "uri"){
					
				}
				if(type == "link"){

					return;
				}

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



				if(type == "undo"){
					document.execCommand('undo', false, null);
				}

				if(type == "image"){
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

					return;
				}else{
					tooltip.classList.remove("image_enable");
					delete $form.file;
				}

				if($this.closest('field[draggable="false"]')){
					if(type == "flow" || type == "item"){
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
						if($this.tagName == "FLOW"){
							var $item = $field.querySelector('item.on');
							var $flows = $this.closest("flows");

							var $nextItem = $item.nextElementSilbing;

							if(!$nextItem){
								var $itemElements = $field.querySelectorAll('item');

								if($flows){
									var $flowElements = $flows.querySelectorAll("flow");

									if($flowElements.length > $itemElements.length){
										var salt = new Date().getTime() + window.location.host;
										var item = document.createElement("item");
											item.id = crc32(salt+$item.id).toString(32).toUpperCase();
											item.setAttribute("type","flow");
											item.setAttribute("draggable","true");


										$field.querySelector("items").appendChild(item);
									}
								}
							}

							if($this.id == $item.id){
								if($this.getAttribute("selected")){
									$this.removeAttribute("selected");
									$item.removeAttribute("from");
									$item.removeAttribute("cc");
									$item.removeAttribute("id");
									$item.removeAttribute("date");
									$item.removeAttribute("link");
									$item.textContent = "";
								}else{
									$this.setAttribute("selected", true);

									$item.setAttribute("from", $this.getAttribute("from"));
									$item.setAttribute("cc", $this.getAttribute("cc"));
									$item.setAttribute("id", $this.getAttribute("id"));
									$item.setAttribute("date", $this.getAttribute("date"));
									$item.setAttribute("link", $this.id);
									$item.textContent = $this.getAttribute("subject");
								}
							}else{
								if($flows){
									var _item = $field.querySelector('item[id="'+$this.id+'"]');
									var _flow = $flows.querySelector('flow[id="'+$item.id+'"]');

									if(_flow){
										_flow.removeAttribute("selected");
									}


									if(_item){
										_item.removeAttribute("selected");
										_item.removeAttribute("from");
										_item.removeAttribute("cc");
										_item.removeAttribute("id");
										_item.removeAttribute("date");
										_item.removeAttribute("link");
										_item.textContent = "";
									}else{
										$this.setAttribute("selected", true);

										$item.setAttribute("from", $this.getAttribute("from"));
										$item.setAttribute("cc", $this.getAttribute("cc"));
										$item.setAttribute("id", $this.getAttribute("id"));
										$item.setAttribute("date", $this.getAttribute("date"));
										$item.setAttribute("link", $this.id);
										$item.textContent = $this.getAttribute("subject");
									}
								}
							}

							_tooltip.removeAttribute("style");
						}
					}else{
						var $fields = $form.querySelectorAll('field[contenteditable="true"]');
						if($fields.length){
							for(var f = 0; f < $fields.length; f++){
								$fields[f].classList.remove("on");
								$fields[f].querySelector("tooltip").removeAttribute("style");
								$fields[f].querySelector("flows").innerHTML = "";
							}
						}
					}


					if($this.tagName == "H0" || $this.tagName == "ITEM"){
						_tooltip = $field.querySelector("tooltip");
						_flows = _tooltip.querySelector("flows");

						$form.file = $this;
						tooltip.classList.add("image_enable");

						$this.classList.add("on");

						var link =  $this.getAttribute('link');

						_tooltip.top = $this.offsetTop;
						_tooltip.$target = $this;

						var $url = _tooltip.querySelector('input[type="uri"]');
						var value = "";

						if($this.getAttribute("link")){
							value = $this.textContent;
						}

						$url.value = value;

						Tooltip(_tooltip);



						if($this.tagName == "ITEM"){
							_flows.body = flows.innerHTML;

						}else{
							_flows.body = "";

						}
					}

					if(_flows){
						var _url = _tooltip.querySelector('input[type="uri"]');

						if(_flows.body){
							_flows.innerHTML = _flows.body;

							var $flowElements = _flows.querySelectorAll('flow');
							var $itemElements = $field.querySelectorAll('item');

							for(var f = 0; f < $flowElements.length; f++){
								var $flowElement = $flowElements[f];

								for(var i = 0; i < $itemElements.length; i++){
									var $itemElement = $itemElements[i];

									if($itemElement.getAttribute("link")){
										if($itemElement.id == $flowElement.id){
											$flowElement.setAttribute("selected", true);
										}
									}
								}
							}
						}else{
							_flows.innerHTML = "";
						}
					}


					if($field){
						$field.classList.add("on");

						tooltip.top = $field.offsetTop + $field.offsetHeight;
						
						tooltip.setAttribute("idx",$field.id);
					}else{
						tooltip.removeAttribute("idx");
						delete tooltip.top;
					}

					Tooltip(tooltip);
				}
			}else{
				// client
				if($this.tagName == "ITEM"){
					var checked = $this.getAttribute("checked");
					if(checked){
						$this.removeAttribute("checked");
					}else{
						$this.setAttribute("checked","checked");
					}
				}
			}
		}
	}
});