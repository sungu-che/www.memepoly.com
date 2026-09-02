window.getFlow = function(){
	var Cc = window.location.origin;

	if(OAuth3.localhost){
		Cc = "http://"+OAuth3.localhost;
	}

	var url = new URL(window.location.href)
	var cc_address = url.hash.replace("#","0x")

	var username = "";
	var search = window.location.search.split("@");

	if(search[1]){
		username = decodeURIComponent(search[1])+"@";
	}

	var hash = ""

	if(window.dialog){
		hash = window.dialog.to.replace("0x", "#")
	}else{
		hash = window.location.hash
	}

	Cc += window.location.pathname+search[0]+hash;

	var request = {
		method : "GET",
		url : OAuth3.host,
		query : {
			href : Cc,
			to : "form",
			cc : Cc
		}
	}

	var response = function(res){
		if(OAuth3.xhr && res.timeStamp){
			OAuth3.xhr.abort()
			delete OAuth3.xhr
		}

		try{
			var $form = document.querySelector('form[name="oauth.network"]');
			var cookies = JSON.parse(res.body.cookies);

			sessionStorage["form"+cc_address] = JSON.stringify(res)

			var rows = res.body.rows;
			var len = rows.length;
			var table = {};

			if(len){
				var tooltip = document.querySelector('field[draggable="false"]');
				var $flows = tooltip.querySelector('flows');

				for(var f = 0; f < len; f++){
					var row = rows[f];
					var team = false;

					if(row.To == "field"){
						var $flow = document.createElement("flow");
							$flow.setAttribute("id", row.Id);
							$flow.setAttribute("from", row.From);
							$flow.setAttribute("to", row.To);
							$flow.setAttribute("cc", row.Cc);
							$flow.setAttribute("subject", row.Subject);
							$flow.setAttribute("flag", row.Flag);
							$flow.setAttribute("date", row.Date);
						$flow.textContent = row.Subject;
						$flows.appendChild($flow);
					}

					var clientAddress = ethers.hashMessage(row.From)
						clientAddress = ethers.computeAddress(clientAddress).toLowerCase()

					if(cc_address == clientAddress){
						team = true
					}

					var index = row.Id.split(" ");
					var formId = "";
					var fieldId = "";
					var fieldIndex = "";
					var inputId = "";
					var inputIndex = "";
					var contentIndex = "";

					for(var i = 0; i < index.length; i++){
						var idx = index[i];
						var num = idx*1;

						if(num > 0){
							if(contentIndex){
								if(!table[formId].Content[contentIndex]){
									table[formId].Content[contentIndex] = row;
								}
								if(table[formId].Content.Length <= num){
									table[formId].Content.Length = num;
								}
								if(row.To == "file"){
									table[formId].Content[contentIndex].data = row.data;
								}
								if(row.To == "link"){
									table[formId].Content[contentIndex].link = row.Subject;
								}
								if(row.To == "count"){
									table[formId].Content[contentIndex].count = row.Subject;
								}
							}else{
								if(typeof table[formId][fieldIndex] == "undefined"){
									table[formId][fieldIndex] = {
										Idx : fieldId,
										Th : {Length : 0},
										Td : {Length : 0}
									}
								}

								if(!inputId){
									if(row.To == "field"){
										inputIndex = 0;
										inputId = fieldId;
										table[formId].Length += 1;
									}
									if(row.To == "file"){
										table[formId][fieldIndex].Th.data = row.data;
									}
									if(row.To == "link"){
										table[formId][fieldIndex].Th.link = row.Subject;
									}
								}

								if(team){
									if(table[formId][fieldIndex].Th.Length <= num){
										table[formId][fieldIndex].Th.Length = num;
									}
									if(!table[formId][fieldIndex].Th[inputIndex]){
										table[formId][fieldIndex].Th[inputIndex] = row;
										table[formId][fieldIndex].Th[inputIndex].Idx = inputId;
									}
									if(row.To == "file"){
										table[formId][fieldIndex].Th[inputIndex].data = row.data;
									}
									if(row.To == "link"){
										table[formId][fieldIndex].Th[inputIndex].link = row.Subject;
									}
									if(row.To == "field"){
										table[formId][fieldIndex].Subject = row.Subject;
									}
								}else{
									table[formId][fieldIndex].Td[inputIndex] = row;
									table[formId][fieldIndex].Td[inputIndex].Idx = inputId;
								}
							}
						}else if(!formId){
							formId = idx+"";

							var nextIndex = index[i+1];

							if(typeof table[idx] == "undefined"){
								table[idx] = {
									Idx : idx,
									Length : 0
								};
							}

							if(typeof nextIndex == "undefined"){
								if(row.To == "count"){
									if(row.Subject){
										table[idx].Count = row.Subject * 1;
									}
								}
								if(row.To == "created"){
									if(row.Subject){
										table[idx].Created = row.Subject;
									}
								}
								if(row.To == "guest"){
									table[idx].Guest = row.Id;
								}
								if(row.To == "started"){
									if(row.Subject){
										table[idx].Started = row.Subject;
									}
								}
								if(row.To == "expired"){
									if(row.Subject){
										table[idx].Expired = row.Subject;
									}
								}
								if(row.To == "file"){
									if(row.data){
										table[idx].data = row.data;
									}
								}
								if(row.To == "link"){
									if(row.data){
										table[idx].link = row.Subject;
									}
								}
							}else if((nextIndex*1) > 0){
								contentIndex = nextIndex;
							}

							if(row.To == "content"){
								if(typeof table[idx].Content == "undefined"){
									table[idx].Content = [];
									table[idx].Content.Length = 0;
								}
							}
						}else if(!fieldId){
							fieldId = idx;
							fieldIndex = index[i+1];
						}else if(!inputId){
							inputId = idx;

							if(row.To != "field"){
								fieldIndex = index[i+1];
								inputIndex = index[i+2];

								if(typeof table[formId][fieldIndex] == "undefined"){
									table[formId][fieldIndex] = {
										Idx : fieldId,
										Th : {Length : 0},
										Td : {Length : 0}
									}
								}
							}
						}
					}
				}
			}

			if(Object.keys(table).length){
				window.dialog.flow = table
				window.dialog.flow.id = rows[0].Id

				var address = ethers.hashMessage(rows[0].From)
					address = ethers.computeAddress(address).toLowerCase()

				window.dialog.flow.to = address
				window.dialog.flow.cc = rows[0].Cc
				window.dialog.flow.subject = rows[0].Subject
				window.dialog.flow.flag = rows[0].Flag
				window.dialog.flow.date = rows[0].Date

				var _from = (cookies.address ? cookies.address : "0x"+cookies.hash) * 1
				var _to = (window.dialog.flow.to.indexOf("0x") == 0 ? window.dialog.flow.to : "0x"+window.dialog.flow.to) * 1
				var _address

				if(cookies.to == _from && cookies.from){
					_from = (cookies.from.indexOf("0x") == 0 ? cookies.from : "0x"+cookies.from) * 1
				}

				if(_from > _to){
					_address = ethers.hashMessage(_from.toString() + _to.toString())
					_address = ethers.computeAddress(_address).toLowerCase()
				}else{
					_address = ethers.hashMessage(_to.toString() + _from.toString())
					_address = ethers.computeAddress(_address).toLowerCase()
				}

				window.dialog.flow.from = _address
				window.dialog.flow.response = res
			}
		}catch(err){
			console.log("err",err);
		}
			
		if(typeof window.Poll.ing == "undefined"){
			window.Poll.ing = setInterval(window.Poll, 600)
		}
	}

	if(sessionStorage["form"+cc_address]){
		response(JSON.parse(sessionStorage["form"+cc_address]))
	}else if(OAuth3.xhr){
		OAuth3.xhr.abort()
		delete OAuth3.xhr
	}

	OAuth3.xhr = OAuth3.fetch(request, response);
}

window.getTable = function(intent, mode, resp, flows, hash){
	var $body = $("body")
	var $nav = $('input[id="nav"]')
	var $status = document.querySelector(".aside .status")

	var player

	try{
		player = window.players.self()
	}catch(err){
		player = {
			follow : false,
			self : true,
			hash : window.cookies.address ? window.cookies.address : window.cookies.hash,
			emoji : "😀",
			x : 1.5,
			y : 0.5,
			z : 1.5
		}
	}

	$(".aside, messages").removeClass("on")

	$body.attr("bingo", "dialog")
	$nav.prop("checked",false)

	if(!window.dialog){
		window.RoomState.dialogFlow = []
		window.RoomState.flow_template = ""

		$("messages ul").html("")
	}

	var $form = document.querySelector('form[name="oauth.network"]')
	var flow

	if(flows){
		try{
			var _flow = flows[window.dialog.index-1]

			if(_flow){
				if(_flow.link){
					var flags = _flow.link.split(" ")

					var field = $form.querySelector('[id="'+flags[1]+'"]')

					if(field){
						window.RoomState.dialogFlow.push(field.outerHTML)
					}
				}
			}
		}catch(err){
			console.log("err",err);
		}

		try{
			flow = flows[window.dialog.index]
		}catch(err){

		}
	}

	if(window.RoomState.form_template.length > 0){
		$form.outerHTML = window.RoomState.form_template
		$form = document.querySelector('form[name="oauth.network"]');
	}else{
		window.RoomState.form_template = $form.outerHTML

		OAuth3.on("submit", function(e){
			var $form = e.target

			if($form.name == "oauth.network"){
				e.preventDefault()

				OAuth3.submit($form)
				
				return
			}
		})
	}

	var tooltip = document.querySelector('field[draggable="false"]');

	if(intent == "flows"){
		var $radio = tooltip.querySelector('items item.radio')
			$radio.className = "flow"
			$radio.setAttribute("type","flow")

		var $checkbox = tooltip.querySelector('items item.checkbox')
			$checkbox.className = "item"
			$checkbox.setAttribute("type","item")
	}

	if(mode){
		$body.addClass("contenteditable")	
	}
	
	$form.className = (mode ? "on" : "on dialog")+" "+intent
	$form.setAttribute("intent",intent)
	
	var Cc = window.location.origin

	if(OAuth3.localhost){
		Cc = "http://"+OAuth3.localhost
	}

	var url = new URL(window.location.href)
	var cc_address = url.hash.replace("#","0x")

	if(hash && !window.dialog){
		if(hash.indexOf("0x") == 0){
			hash = hash.replace("0x", "#")
		}else{
			hash = "#"+hash
		}

		window.dialog = {
			to : hash.replace("#","0x")
		}
	}else if(window.dialog){
		cc_address = window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : player.hash
		hash = cc_address.replace("0x", "#")
	}else{
		hash = window.location.hash
	}

	var username = ""
	var search = window.location.search.split("@")

	if(search[1]){
		username = decodeURIComponent(search[1])+"@"
	}

	Cc += hash

	if(Cc && $form){
		$form.setAttribute("cc", Cc)

		var request = {
			method : "GET",
			url : OAuth3.host,
			query : {
				href : Cc,
				to : intent,
				cc : Cc
			}
		}
		
		var response = function(res){
			if(OAuth3.xhr && res.timeStamp){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}

			var isSessionStorage = sessionStorage[intent+cc_address]

			sessionStorage[intent+cc_address] = JSON.stringify(res)

			if(isSessionStorage && $form.getAttribute("to")){
				return
			}

			var contenteditable = false
			var draggable = false
			var cookies = JSON.parse(res.body.cookies)

			if(cookies.address){
				if(cc_address == cookies.address){
					contenteditable = true
				}
			}

			var rows = res.body.rows
			var date = new Date()
			var len = rows.length

			if(contenteditable){
				try{
					document.querySelector('[id="oauth.network.guest"]').checked = true

					draggable = true

					if(window.location.search.length > 0){
						draggable = false
					}

					if(!len){
						var salt = date.getTime() + window.location.host
						var formId = crc32(salt+res.body.query.to).toString(32).toUpperCase()
						var fieldId = crc32(salt+"field").toString(32).toUpperCase()
						var inputId = crc32(salt+"input").toString(32).toUpperCase()

						rows = [
							{
								Id : formId,
								From : cookies.email,
								To : res.body.query.to,
								Cc : Cc,
								Subject : "",
								Flag : "",
								Date : date
							},
							{
								Id : formId+" "+fieldId+" "+1,
								From : cookies.email,
								To : "field",
								Cc : Cc,
								Subject : "",
								Flag : formId,
								Date : date
							},
							{
								Id : formId+" "+fieldId+" "+inputId+" "+1+" "+1,
								From : cookies.email,
								To : intent == "flows" ? "flow" : "radio",
								Cc : Cc,
								Subject : "",
								Flag : fieldId,
								Date : date
							}
						]

						len = rows.length;
					}
				}catch(err){
					console.log("err",err);
				}
			}

			var To = "";
			var table = {};

			try{
				if(len){
					for(var f = 0; f < len; f++){
						var row = rows[f];
						var team = false;

						var clientAddress = ethers.hashMessage(row.From)
							clientAddress = ethers.computeAddress(clientAddress).toLowerCase()

						if(cc_address == clientAddress){
							team = true
						}

						var index = row.Id.split(" ");
						var formId = ""
						var fieldId = ""
						var fieldIndex = ""
						var inputId = ""
						var inputIndex = ""
						var contentIndex = ""

						for(var i = 0; i < index.length; i++){
							var idx = index[i]
							var num = idx*1

							if(num > 0){
								if(contentIndex){
									if(!table[formId].Content[contentIndex]){
										table[formId].Content[contentIndex] = row;
									}
									if(table[formId].Content.Length <= num){
										table[formId].Content.Length = num;
									}
									if(row.To == "file"){
										table[formId].Content[contentIndex].data = row.data;
									}
									if(row.To == "link"){
										table[formId].Content[contentIndex].link = row.Subject;
									}
									if(row.To == "count"){
										table[formId].Content[contentIndex].count = row.Subject;
									}
								}else{
									if(typeof table[formId][fieldIndex] == "undefined"){
										table[formId][fieldIndex] = {
											Idx : fieldId,
											Th : {Length : 0},
											Td : {Length : 0}
										}
									}

									if(!inputId){
										if(row.To == "field"){
											inputIndex = 0
											inputId = fieldId
											table[formId].Length += 1
										}
										if(row.To == "file"){
											table[formId][fieldIndex].Th.data = row.data
										}
										if(row.To == "link"){
											table[formId][fieldIndex].Th.link = row.Subject
										}
									}

									if(team){
										if(flow){
											try{
												var flags = flow.link.split(" ")

												if(row.Id == flags[0]){
												}else if(row.Id.indexOf(flags[1]) == -1){
													continue
												}
											}catch(err){

											}
										}

										if(table[formId][fieldIndex].Th.Length <= num){
											table[formId][fieldIndex].Th.Length = num
										}
										if(!table[formId][fieldIndex].Th[inputIndex]){
											table[formId][fieldIndex].Th[inputIndex] = row
											table[formId][fieldIndex].Th[inputIndex].Idx = inputId
										}
										if(row.To == "file"){
											table[formId][fieldIndex].Th[inputIndex].data = row.data
										}
										if(row.To == "link"){
											table[formId][fieldIndex].Th[inputIndex].link = row.Subject
										}
										if(row.To == "field"){
											table[formId][fieldIndex].Subject = row.Subject
										}
									}else{
										table[formId][fieldIndex].Td[inputIndex] = row
										table[formId][fieldIndex].Td[inputIndex].Idx = inputId
									}
								}
							}else if(!formId){
								formId = idx+""

								var nextIndex = index[i+1]

								if(typeof table[idx] == "undefined"){
									table[idx] = {
										Idx : idx,
										Length : 0
									}
								}

								if(!To){
									To = row.From ? row.From : cookies.email
									table[formId].Subject = row.Subject ? row.Subject : ""
								}

								if(typeof nextIndex == "undefined"){
									if(row.To == "count"){
										if(row.Subject){
											table[idx].Count = row.Subject * 1
										}
									}
									if(row.To == "created"){
										if(row.Subject){
											table[idx].Created = row.Subject
										}
									}
									if(row.To == "guest"){
										table[idx].Guest = row.Id
									}
									if(row.To == "started"){
										if(row.Subject){
											table[idx].Started = row.Subject
										}
									}
									if(row.To == "expired"){
										if(row.Subject){
											table[idx].Expired = row.Subject
										}
									}
									if(row.To == "file"){
										if(row.data){
											table[idx].data = row.data
										}
									}
									if(row.To == "link"){
										if(row.data){
											table[idx].link = row.Subject
										}
									}
								}else if((nextIndex*1) > 0){
									contentIndex = nextIndex
								}

								if(row.To == "content"){
									if(typeof table[idx].Content == "undefined"){
										table[idx].Content = []
										table[idx].Content.Length = 0
									}
								}
							}else if(!fieldId){
								fieldId = idx
								fieldIndex = index[i+1]
							}else if(!inputId){
								inputId = idx

								if(row.To != "field"){
									fieldIndex = index[i+1]
									inputIndex = index[i+2]

									if(typeof table[formId][fieldIndex] == "undefined"){
										table[formId][fieldIndex] = {
											Idx : fieldId,
											Th : {Length : 0},
											Td : {Length : 0}
										}
									}
								}
							}
						}
					}
					
					if(To){
						$form.setAttribute("to", To)
					}else if(contenteditable){
						$form.setAttribute("to", cookies.email)
					}

					if(cookies.email){
						$form.setAttribute("client", cookies.email)
					}
					
					$form.setAttribute("draggable", draggable)
					
					var $fields = $form.querySelector("fields");
					var tooltip = document.querySelector('field[draggable="false"]');
					var beforeElement;

					if(Object.keys(table).length){
						if(!resp && $form.className.indexOf("dialog") > -1){
							if(rows[0].To == "flows"){
								window.dialog = table
								window.dialog.id = rows[0].Id

								var address = ethers.hashMessage(rows[0].From)
									address = ethers.computeAddress(address).toLowerCase()

								window.dialog.to = address
								window.dialog.cc = rows[0].Cc
								window.dialog.subject = rows[0].Subject
								window.dialog.flag = rows[0].Flag
								window.dialog.date = rows[0].Date

								var _from = (cookies.address ? cookies.address : "0x"+cookies.hash) * 1
								var _to = (window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : "0x"+window.dialog.to) * 1
								var _address

								if(cookies.to == _from && cookies.from){
									_from = (cookies.from.indexOf("0x") == 0 ? cookies.from : "0x"+cookies.from) * 1
								}

								if(_from > _to){
									_address = ethers.hashMessage(_from.toString() + _to.toString())
									_address = ethers.computeAddress(_address).toLowerCase()
								}else{
									_address = ethers.hashMessage(_to.toString() + _from.toString())
									_address = ethers.computeAddress(_address).toLowerCase()
								}

								window.dialog.from = _address
							}
						}

						for(var prop in table) {
							if(table.hasOwnProperty(prop)) {
								var group = table[prop];
								
								if(group.Length){
									$form.id = group.Idx;

									for(var s = 1; s <= group.Length; s++){
										var tr = group[s];

										if(tr.Th.Length){
											var $field = document.createElement("field");
												$field.innerHTML = tooltip.innerHTML;
												$field.id = tr.Idx;

											if($field.querySelector("toolbar")){
												$field.querySelector("toolbar").outerHTML = "";
											}

											if(contenteditable && mode){
												$field.setAttribute("contenteditable", "true");

												if(draggable){
													$field.setAttribute("draggable", draggable);
												}
											}

											var $items = $field.querySelector("items");
												$items.innerHTML = "";

											for(var h = 0; h <= tr.Th.Length; h++){
												var item = tr.Th[h];
												var th = tr.Th[""];

												if(h){
													if(item){
														var type = $field.getAttribute("type");

														if(!type && item.To){
															$field.setAttribute("type", item.To);
														}

														var index = item.Id.split(" ");
														var $item = document.createElement("item");
															$item.id = item.Idx;
															$item.setAttribute("type", item.To);
															$item.textContent = item.Subject ? item.Subject : "";

														if(item.data){
															$item.style["background-image"] = 'url('+item.data+')';
														}

														if(item.link){
															$item.setAttribute("link", item.link);
														}

														if(contenteditable && mode){
															if(draggable){
																$item.setAttribute("draggable", draggable);
																$item.setAttribute("contenteditable", true);
															}
														}else if(!item.Subject){
															$item.setAttribute("contenteditable", true);
														}
														
														$items.appendChild($item);
													}
												}else{
													var $h0 = $field.querySelector("h0");
														$h0.textContent = item.Subject;
													
													if(th){
														if(th.data){
															$h0.style["background-image"] = 'url('+th.data+')';
														}
														
														if(th.link){
															$h0.setAttribute("link", th.link);

															try{
																var th_url = new URL(th.link)
																var media = ""
																var oembed = window.oembed(th_url)

																if(oembed.provider){
																	media = '<div class="media"><img src="'+oembed.src+'"></div>'
																}else{
																	media = '<div class="media"><img src="https://'+oembed.host+'/favicon.ico"></div>'
																}

																$h0.outerHTML = media+$h0.outerHTML
															}catch(err){

															}
														}
													}
												}
											}
											
											$fields.insertBefore($field, tooltip);
											
											if(!beforeElement){
												beforeElement = $field;
											}
										}
										
										tr.Td.Length = Object.keys(tr.Td).length;

										if(tr.Td.Length){
											for(var index in tr.Td){
												if(tr.Td.hasOwnProperty(index)) {
													var item = tr.Td[index];

													if(item){
														var $item = document.getElementById(item.Idx);

														if($item){
															$item.setAttribute("checked", "checked");

															if(item.Subject){
																$item.textContent = decodeURIComponent(item.Subject);
															}
														}
													}
												}
											}
										}
									}

									var headingField = document.createElement("field");
										headingField.id = group.Idx;
										headingField.innerHTML = tooltip.innerHTML;
										headingField.className = "heading";

									var $h0 = headingField.querySelector("h0");

									if(group.Subject){
										$h0.textContent = group.Subject;
									}

									if(group.data){
										$h0.style["background-image"] = 'url('+group.data+')';
									}

									if(group.link){
										$h0.setAttribute("link", group.link);
									}

									if(group.Content){
										var $items = headingField.querySelector("items");
											$items.innerHTML = "";

										for(var c = 1; c <= group.Content.Length; c++){
											var content = group.Content[c];
											var $item = document.createElement("item");
												$item.id = content.Id;
												$item.setAttribute("type", content.To);
												$item.textContent = content.Subject ? content.Subject : "";

											if(content.link){
												$item.setAttribute("link", content.link);
											}

											if(content.data){
												$item.style["background-image"] = 'url('+content.data+')';
											}

											$items.appendChild($item);
										}
									}

									var $toolbar = headingField.querySelector("toolbar");

									if($toolbar){
										var $count = $toolbar.querySelector('[name="count"]');

										if(typeof group.Count != "undefined"){
											$count.value = group.Count;
										}

										var $guest = $toolbar.querySelector('[name="guest"]');
										var $created = $toolbar.querySelector('[name="created"]');
										var $started = $toolbar.querySelector('[name="started"]');
										var $expired = $toolbar.querySelector('[name="expired"]');

										if(group.Created){
											if($created){
												$created.value = group.Created;
											}
										}
										
										if(group.Guest){
											if($guest){
												$guest.checked = true;
												
												$form.setAttribute("guest", group.Guest);
											}
										}

										if(typeof group.Started != "undefined" && typeof group.Expired != "undefined"){
											if($started && $expired){
												$started.value = group.Started;
												$expired.value = group.Expired;
												
												if(!contenteditable){
													$started.setAttribute("readonly", true);
													$expired.setAttribute("readonly", true);
												}
											}
										}
									}
									
									if(contenteditable && mode){
										$form.setAttribute("contenteditable", true);
										tooltip.setAttribute("contenteditable", false);

										headingField.setAttribute("contenteditable", true);
									}

									$fields.insertBefore(headingField, beforeElement);
								}
							}
						}
					}

					if(!mode){
						var $heading = $form.querySelector('field.heading');

						var dialogFlowBody = ''

						if(window.RoomState.dialogFlow.length){
							for(var d = 0; d < window.RoomState.dialogFlow.length; d++){
								dialogFlowBody += window.RoomState.dialogFlow[d]
							}
						}

						if(window.RoomState.flow_template && $heading){
							$heading.outerHTML = window.RoomState.flow_template + dialogFlowBody
						}

						if(flow){
							try{
								window.RoomChat(flows[window.dialog.index])
							}catch(err){
								console.log("err",err);
							}
						}
					}
				}
			}catch(err){
				console.log("err",err);
			}

			if(intent == "flows"){
				if(len){
					if(!mode && window.RoomState.flow_template.length == 0){
						var $fields = $form.querySelector('fields');

						var $temp = document.createElement("div")
							$temp.innerHTML = $fields.innerHTML
							$($temp).find('field[type="flow"] items, field[type="flow"] tooltip, field[draggable="false"]').remove()

						window.RoomState.flow_template += $temp.innerHTML
					}
				}
			}else{
				var tooltip = document.querySelector('field[draggable="false"]');
				var $flows = tooltip.querySelector('flows');
					$flows.innerHTML = ""
			}

			try{
				var to = $form.getAttribute("to");
				var client = $form.getAttribute("client");
				var $details = $form.querySelector('details');

				if(client){
					var _from = contenteditable ? to : client
					var _to = contenteditable ? client : to

					_from = _from.indexOf("0x") == 0 ? _from.replace("0x","#") : "#"+_from
					_to = _to.indexOf("0x") == 0 ? _to.replace("0x","#") : "#"+_to

					var query = {
						href : Cc,
						from : _from,
						to : _to,
						cc : "#message"
					}

					if(query.from == query.to && contenteditable){
						delete query.from;
					}

					if(res.timeStamp){
						OAuth3.xhr = OAuth3.fetch({
							method : "GET",
							url : OAuth3.host,
							query : query
						}, function(res){
							if(OAuth3.xhr){
								OAuth3.xhr.abort()
								delete OAuth3.xhr
							}

							var $cable = $details.querySelector("cable");
							var $tbody = $details.querySelector("tbody");

							$cable.rows = [];

							var tbody = "";

							if(res.body){
								if(res.body.rows){
									var len = res.body.rows.length;

									for(var i = 0; i < len; i++){
										var row = res.body.rows[i];
										var created_date = row.Date.split("T");
										var created_time = created_date[1];
											created_time = created_time.split(".")[0];
											created_date = created_date[0];

										var created = new Date(row.Date).getTime();
										var booking = (i+"")*1;
										
										var attr = row.Flow ? 'flow="'+row.Flow+'"' : "";
										var href = row.Cc+"";
										var booking_date = "";

										if(row.Flag.indexOf(row.Cc) > -1){
											href = row.Cc+row.Flag.split(row.Cc)[1];

											try{
												var url = new URL(window.location.origin + row.Cc);

												if(url.searchParams.get("id")){
													var d = new Date(url.searchParams.get("id").split("@")[0]);

													if(d instanceof Date){
														var isoDate = d.toISOString();

														booking = d.getTime();
														booking_date = isoDate.split("T");

														var time = booking_date[1];
															time = time.split(".")[0];
															booking_date = booking_date[0];
													}
												}
											}catch(err){
												console.log("Err",err);
											}
										}

										tbody += '<tr id="'+row.Cc+'">\
											<td class="col_flow"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'></a></td>\
											<td class="col_email"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'>'+row.From+'</a></td>\
											<td class="col_subject"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'>'+decodeURIComponent(row.Subject)+'</a></td>\
											<td class="col_booking"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'><time datetime="'+row.Date+'">'+booking_date+'</time></a></td>\
											<td class="col_created"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'><time datetime="'+row.Date+'">'+created_date+'</time></a></td>\
										</tr>';

										$cable.rows.push({
											Flow : row.Flow,
											From : row.From,
											To : row.To,
											Cc : row.Cc,
											Flag : row.Flag,
											Subject : row.Subject,
											Date : row.Date,
											Created : created,
											Booking : booking
										});
									}

									$tbody.innerHTML = tbody;
								}
							}

							if(intent == "flows"){
								window.getFlow()

								return
							}

							if(typeof window.Poll.ing == "undefined"){
								window.Poll.ing = setInterval(window.Poll, 600)
							}
						});
					}else{
						window.getFlow()
					}
				}else{
					if(intent == "flows"){
						window.getFlow()

						return
					}

					if(typeof window.Poll.ing == "undefined"){
						window.Poll.ing = setInterval(window.Poll, 600)
					}
				}
			}catch(err){
				console.log("err",err)
			}
		}

		if(resp){
			response(resp)
		}else{
			if(OAuth3.xhr){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}

			if(sessionStorage[intent+cc_address]){
				response(JSON.parse(sessionStorage[intent+cc_address]))
			}

			OAuth3.xhr = OAuth3.fetch(request, response);
		}
	}
}

OAuth3.submit = function($form, callback){
	var cookies = window.cookies

	var $status = document.querySelector(".aside .status")

	var host = window.location.host;

	if(OAuth3.localhost){
		host = OAuth3.localhost;
	}
	
	var host_flag = "#tag "+host;
	var hash = window.location.hash;
	var team = false
	var player = window.players.self()

	if(window.dialog){
		cc_address = window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : player.hash

		hash = cc_address.replace("0x", "#")
	}

	if(hash){
		var cc_address = hash.replace("#","0x")
		var clientAddress = cookies.address ? cookies.address : cookies.hash

		if(clientAddress == cc_address){
			team = true 
		}else{
			var _hash = "#"+crc32(clientAddress).toString(32).toUpperCase();

			host_flag = host_flag.replace("#tag", _hash);
		}

		host_flag = host_flag+hash;
	}

	var draggable = $form.getAttribute("draggable") ? JSON.parse($form.getAttribute("draggable")) : false;
	var contenteditable = $form.getAttribute("contenteditable") ? true : false;

	$status.innerHTML = '<div class="loading">\
		<strong>Loading...</strong>\
	</div>'

	if(contenteditable){
		var url = new URL($form.getAttribute("cc"));
		var Cc = url.pathname+hash;
		var To = $form.getAttribute("to");
		var Client = $form.getAttribute("client");
		var files = {};
		var links = {};
		
		var $fields = document.querySelectorAll('field[contenteditable="true"]');
		var $heading = $form.querySelector('field.heading h0');
		
		if($heading.getAttribute("link")){
			links[$form.id] = $heading.getAttribute("link");
		}

		var intent = $form.getAttribute("intent")
		var rows = [];
		var form_file;
		var form_row = {
			id : $form.id,
			to : To == Client ? intent : To,
			cc : Cc,
			flag : To == Client ? host_flag : host_flag.replace("#tag", "#"+$form.id),
			subject : $heading.textContent
		}

		if($heading.Blob){
			form_row.blob = {
				key : $form.id,
				type: $heading.Blob.type,
				success_action_redirect : OAuth3.host
			};

			files[$form.id] = $heading.Blob;
		}else if($heading.style["background-image"]){
			form_file = {
				id : $form.id,
				to : "file",
				cc : Cc,
				subject : To+"/"+$form.id,
				flag : host
			}
		}

		rows.push(form_row);

		if(form_file){
			rows.push(form_file);
		}

		if($heading.getAttribute("link")){
			rows.push({
				id : $form.id,
				to : "link",
				cc : Cc,
				subject : $heading.getAttribute("link"),
				flag : host
			})
		}

		var len = $fields.length;

		for(var i = 0; i < len; i++){
			var $field = $fields[i];
				$field.h0 = $field.querySelector("h0");

			var type = $field.getAttribute("type");
			var id = $form.id+" "+$field.id;

			if(i){
				var field_row = {
					id : id+" "+i,
					to : "field",
					cc : Cc,
					flag : $form.id,
					subject : $field.h0.textContent
				}

				var field_file = null;

				if($field.h0.Blob){
					field_row.blob = {
						key : id+" "+i,
						type: $field.h0.Blob.type,
						success_action_redirect : OAuth3.host
					};

					files[id+" "+i] = $field.h0.Blob;
				}else if($field.style["background-image"]){
					field_file = {
						id : id+" "+i,
						to : "file",
						cc : Cc,
						subject : To+"/"+id+" "+i,
						flag : host
					}
				}

				rows.push(field_row);

				if(field_file){
					rows.push(field_file);
				}

				if($field.h0.getAttribute("link")){
					rows.push({
						id : id+" "+i,
						to : "link",
						cc : Cc,
						subject : $field.h0.getAttribute("link"),
						flag : $field.id
					})
				}

				var $item = $field.querySelectorAll("item");

				for(var o = 0; o < $item.length; o++){
					var inputId = id+" "+$item[o].id+" "+i+" "+(o+1);
					var input_row = {
						id : inputId,
						to : type,
						cc : Cc,
						flag : $field.id,
						subject : $item[o].textContent
					};

					var input_file = null;

					if($item[o].Blob){
						input_row.blob = {
							key : inputId,
							type: $item[o].Blob.type,
							success_action_redirect : OAuth3.host
						};

						files[inputId] = $item[o].Blob;
					}else if($item[o].style["background-image"]){
						input_file = {
							id : inputId,
							to : "file",
							cc : Cc,
							subject : To+"/"+inputId,
							flag : host
						}
					}

					if($item[o].getAttribute("checked") || draggable){
						rows.push(input_row);
					}

					if($item[o].getAttribute("link")){
						rows.push({
							id : inputId,
							to : "link",
							cc : Cc,
							subject : $item[o].getAttribute("link"),
							flag : $item[o].id
						})
					}

					if(input_file){
						rows.push(input_file);
					}
				}
			}
		}

		var $count = document.querySelector('field.heading toolbar input[name="count"]');

		if($count){
			rows.push({
				id : $form.id,
				to : "count",
				cc : Cc,
				subject : $count.value,
				flag : host
			})
		}

		var $started = document.querySelector('field.heading toolbar input[name="started"]');
		var $expired = document.querySelector('field.heading toolbar input[name="expired"]');
		var $guest = document.querySelector('field.heading toolbar input[name="guest"]');
		var $created = document.querySelector('field.heading toolbar input[name="created"]');

		if($guest){
			if($guest.checked){
				rows.push({
					id : $form.id,
					to : "guest",
					cc : Cc,
					subject : "",
					flag : host
				})
			}
		}

		if($created){
			var created = $created.value;

			if(!created){
				created = new Date().toISOString()
					.replace(/T/, ' ')
					.replace(/\..+/, '')
			}

			rows.push({
				id : $form.id,
				to : "created",
				cc : Cc,
				subject : created,
				flag : $form.id
			})

			rows.push({
				id : $form.id,
				to : "created",
				cc : Cc,
				subject : Cc,
				flag : host,
				date : created
			})
		}

		if($started && $expired && $started.value && $expired.value){
			var started = new Date($started.value).toISOString()
				.replace(/T/, ' ')
				.replace(/\..+/, '')

			rows.push({
				id : $form.id,
				to : "started",
				cc : Cc,
				subject : started,
				flag : $form.id
			})

			rows.push({
				id : $form.id,
				to : "started",
				cc : Cc,
				subject : Cc,
				flag : host,
				date : started
			})

			var expired = new Date($expired.value).toISOString()
				.replace(/T/, ' ')
				.replace(/\..+/, '')

			rows.push({
				id : $form.id,
				to : "expired",
				cc : Cc,
				subject : expired,
				flag : $form.id
			})

			rows.push({
				id : $form.id,
				to : "expired",
				cc : Cc,
				subject : Cc,
				flag : host,
				date : expired
			})
		}

		var $content = document.querySelectorAll('field.heading item');

		if($content.length){
			for(var d = 0; d < $content.length; d++){
				var $desc = $content[d];
				var $desc_id = $form.id+" "+(d+1);
				var desc_row = {
					id : $desc_id,
					to : "content",
					cc : Cc,
					subject : $desc.textContent,
					flag : $form.id
				}

				var desc_file;

				if($desc.Blob){
					desc_row.blob = {
						key : $desc_id,
						type: $desc.Blob.type,
						success_action_redirect : OAuth3.host
					};

					files[$desc_id] = $desc.Blob;
				}else if($desc.style["background-image"]){
					desc_file = {
						id : $desc_id,
						to : "file",
						cc : Cc,
						subject : To+"/"+$desc_id,
						flag : host
					}
				}

				rows.push(desc_row);

				if($desc.getAttribute("link")){
					rows.push({
						id : $desc_id,
						to : "link",
						cc : Cc,
						subject : $desc.getAttribute("link"),
						flag : $form.id
					})
				}

				if(desc_file){
					rows.push(desc_file);
				}
			}
		}

		var cc_url = window.location.href;
		var href = window.location.href;

		if(OAuth3.localhost){
			cc_url = "http://"+OAuth3.localhost+window.location.pathname+hash;
			href = "http://"+OAuth3.localhost+window.location.pathname+hash;
		}

		var request = {
			method : "POST",
			url : OAuth3.host,
			query : {
				href : href,
				to : "form",
				cc : cc_url
			},
			body : {
				rows : rows
			}
		}

		var response = function(res){
			var cookies = JSON.parse(res.body.cookies);

			if(cookies.email){
				$status.innerHTML = ''
			}else{
				$status.innerHTML = '<a href="/login/">Sign In</a>'
			}

			var rows = res.body.rows;
			var len = rows.length;

			for(var r = 0; r < len; r++){
				var row = rows[r];
				var blob = files[row.Id];

				if(blob && row.Blob){
					row.Blob.fields["Content-Type"] = blob.type;

					OAuth3.fetch({
						method : "POST",
						url : row.Blob.url,
						formData : row.Blob.fields,
						blob : blob
					}, function(resp){

					});
				}
			}

			if(callback){
				callback(res);
			}
		}

		try{
			if(OAuth3.xhr){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}

			OAuth3.xhr = OAuth3.fetch(request, response);
		}catch(err){

		}
	}else{
		var url = new URL($form.getAttribute("cc"));
		
		var $guest = document.querySelector('[name="guest"]');
		var body = {};
		var $fields = document.querySelectorAll('field[id]');
		var Subject = "";

		if(url.username){
			Subject = url.username;
		}

		if(url.password){
			Subject += "@"+url.password;
		}

		if($form.getAttribute("cc")){
			var _url = new URL($form.getAttribute("cc"));
			var _hash = "#"+$form.id

			host_flag = _hash+" "+host+_url.hash;
		}

		var Cc = url.pathname+hash;
		var to = $form.getAttribute("to")
		var rows = [{
			id : $form.id,
			to : to,
			cc : Cc,
			subject : Subject,
			flag : host_flag
		}];

		var len = $fields.length;

		if($guest && !cookies.email){
			var id = $form.getAttribute("guest");

			if($guest.checked && id){
				var $from = document.querySelector('field[id="'+id+'"] h0');

				if($from){
					body.from = $from.textContent;
				}

				body.to = $form.getAttribute("to");
			}
		}

		var isAgree = true
		var isEmail = false
		var isPhone = false

		var regex = {
			phone : /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g,
			email : /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		}

		for(var i = 0; i < len; i++){
			var $field = $fields[i];
			var type = $field.getAttribute("type");
			var id = $form.id+" "+$field.id;

			if(i){
				var $item = $field.querySelectorAll("item");

				for(var o = 0; o < $item.length; o++){
					var privacy = $item[o].getAttribute("privacy")

					if($item[o].getAttribute("checked") || $item[o].getAttribute("readonly") || $item[o].getAttribute("check")){
						var subject = "";

						if(privacy){
							isAgree = false
						}else{
							if(contenteditable){
								subject = $item[o].textContent;
							}else{
								subject = $item[o].getAttribute("contenteditable") ? $item[o].textContent : "";
							}

							if(subject.toLowerCase().match(regex.email)){
								isEmail = true
							}

							if(subject.toLowerCase().match(regex.phone)){
								isPhone = true
							}

							rows.push({
								id : id+" "+$item[o].id+" "+i+" "+(o+1),
								to : type,
								cc : Cc,
								flag : $field.id,
								subject : subject
							})
						}
					}
				}
			}
		}

		var cc_url = window.location.href;
		var href = window.location.href;

		if(OAuth3.localhost){
			cc_url = "http://"+OAuth3.localhost+window.location.pathname+hash;
			href = "http://"+OAuth3.localhost+window.location.pathname+hash;
		}

		var request = {
			method : "POST",
			url : OAuth3.host+"/",
			query : {
				href : href,
				to : "form",
				cc : cc_url
			},
			body : {
				rows : rows,
				to : $form.getAttribute("to")
			}
		}

		if(Object.keys(body).length){
			for(var prop in body){
				if(body.hasOwnProperty(prop)) {
					request.body[prop] = body[prop];
				}
			}
		}

		if(!isAgree && (isEmail || isPhone)){
			var $field = $form.querySelector('field[draggable="false"]')

			var privacyBody = '<field class="privacy">\
				<h0>Do you agree on the provision of personal information to a third party?</h0>\
				<items>\
					<item class="checkbox privacy" type="checkbox">agree</item>\
				</items>\
			</field>'

			$field.outerHTML = privacyBody+$field.outerHTML

			return
		}

		var response = function(res){
			if(callback){
				callback(res);
			}
		}

		try{
			if(OAuth3.xhr){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}

			OAuth3.xhr = OAuth3.fetch(request, response);
		}catch(err){

		}
	}
}