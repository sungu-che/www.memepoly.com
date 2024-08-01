; (function() {
	function getTable(){
		var $form = document.querySelector('form[name="oauth.network"]');
		
		var Cc = window.location.origin;

		if(OAuth3.localhost){
			Cc = "http://"+OAuth3.localhost;
		}

		var username = "";
		var search = window.location.search.split("@");

		if(search[1]){
			username = decodeURIComponent(search[1])+"@";
		}


		Cc += window.location.pathname+search[0]+window.location.hash;

		if(typeof OAuth3.Cc != "undefined"){
			Cc = OAuth3.Cc;
		}
		
		if(Cc && $form){
			var request = {
				method : "GET",
				url : OAuth3.host,
				query : {
					to : "form",
					cc : Cc
				}
			}
			
			// 값 받기
			var response = function(res){
				var contenteditable = false;
				var draggable = false;

				var cookies = JSON.parse(res.body.cookies);

				if(cookies.email){
					if(OAuth3.teams){
						if(OAuth3.teams[cookies.email]){
							contenteditable = true;
						}
					}
				}

				var rows = res.body.rows;

				var date = new Date();
				var len = rows.length;

				if(contenteditable){
					draggable = true;

					if(window.location.search.length > 0){
						draggable = false;
					}

					if(!len){
						var salt = date.getTime() + window.location.host;
						var formId = crc32(salt+request.query.to).toString(32).toUpperCase();
						var fieldId = crc32(salt+"field").toString(32).toUpperCase();

						var inputId = crc32(salt+"input").toString(32).toUpperCase();

						rows = [
							{
								Id : formId, // 게시글 아이디
								From : cookies.email, // 보낸 client kakao email
								To : request.query.to, // 받는 개인
								Cc : Cc, // 그룹 레퍼러
								Subject : "", // 제목
								Flag : "", //
								Date : date
							},
							{
								Id : formId+" "+fieldId+" "+1, // 게시글 아이디
								From : cookies.email, // 보낸 client kakao email
								To : "field", // 받는 개인
								Cc : Cc, // 그룹 레퍼러
								Subject : "", // 제목
								Flag : formId, //
								Date : date
							},
							{
								Id : formId+" "+fieldId+" "+inputId+" "+1+" "+1, // 게시글 아이디
								From : cookies.email, // 보낸 client kakao email
								To : "checkbox", // 받는 개인
								Cc : Cc, // 그룹 레퍼러
								Subject : "", // 제목
								Flag : fieldId, //
								Date : date
							}
						]

						len = rows.length;
					}
				}

				var limit = rows.limit;
				var To = "";
				var table = {};

				if(len){
					var flow = false;
					for(var f = 0; f < len; f++){
						var row = rows[f];
						var team = flow ? flow : false;
						
						if(OAuth3.teams[row.From]){
							team = true;

							if(row.To == "form"){
								if(row.From != cookies.email){
									contenteditable = false;
								}
							}
						}else if(row.To == "form"){
							flow = team = true;
							contenteditable = false;
						}
						
						if(flow){
							if(OAuth3.teams[row.From]){
								team = false;
							}
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

								if(!To){
									if(OAuth3.teams[row.To]){
										if(OAuth3.teams[cookies.email]){
											To = row.From;
										}else{
											To = row.To;
										}
										
										table[formId].Subject = row.Subject;
									}else if(row.To == request.query.to){
										To = row.From;
										table[formId].Subject = row.Subject;
									}
								}

								if(OAuth3.teams[row.From]){
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
					
					if(To){
						$form.setAttribute("to", To);
					}else if(contenteditable){
						$form.setAttribute("to", cookies.email);
					}

					$form.setAttribute("client", cookies.email);
					
					// $form.setAttribute("to", To);
					$form.setAttribute("cc", Cc);
					$form.setAttribute("draggable", draggable);
					
					var $fields = $form.querySelector("fields");
					var tooltip = document.querySelector('field[draggable="false"]');
					var beforeElement;
					
					for(var prop in table) {
						if(table.hasOwnProperty(prop)) {
							var group = table[prop];
							
							if(group.Length){
								$form.id = group.Idx;

								for(var s = 1; s <= group.Length; s++){
									var tr = group[s];

									// team 콘텐츠
									if(tr.Th.Length){
										var $field = document.createElement("field");
											$field.innerHTML = tooltip.innerHTML;
											$field.id = tr.Idx;

										if($field.querySelector("toolbar")){
											$field.querySelector("toolbar").outerHTML = "";
										}

										if(contenteditable){
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

													if(contenteditable){
														if(draggable){
															$item.setAttribute("draggable", draggable);
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
													}
												}
											}
										}
										
										$fields.insertBefore($field, tooltip);
										
										if(!beforeElement){
											beforeElement = $field;
										}
									}
									
									// client 콘텐츠
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
									var body = "";
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
								
								
								
								if(contenteditable){
									$form.setAttribute("contenteditable", true);
									tooltip.setAttribute("contenteditable", false);
								}
								
								if(contenteditable){
									headingField.setAttribute("contenteditable", true);
								}
								
								$fields.insertBefore(headingField, beforeElement);
							}
						}
					}
				}
				
				if(OAuth3.on){
					if(OAuth3.on.load){
						OAuth3.on.load(res, table, contenteditable);
					}
				}
			}

			OAuth3.fetch(request, response);
		}
	}

	var Origin = typeof OAuth3.Origin != "undefined" ? OAuth3.Origin : window.location.origin;

	if(OAuth3.localhost){
		Origin = "http://"+OAuth3.localhost;
	}
	
	if(Origin){
		// 메뉴 & 멤버 조회
		var request = {
			method : "GET",
			query : {
				cc : Origin
			}
		}

		// 값 받기
		var response = function(res){
			var rows = res.body.rows;
			var cookies = JSON.parse(res.body.cookies);

			var target = document.querySelector("sitemap");

			var len = rows.length;

			var limit = rows.limit;

			var teams = {};

			var table = {};

			if(!rows.length){
				rows.push({
					Id : " ", // 게시글 아이디
					From : "", // 보낸 client kakao email
					To : "", // 받는 개인
					Cc : "", // 그룹 레퍼러
					Subject :"", // 제목
					Flag : "", //
					Date : new Date()
				})
			}

			var len = rows.length;

			for(var f = 0; f < len; f++){
				var row = rows[f];

				teams[row.From] = row;
			}

			OAuth3.teams = teams;
			
			var contenteditable = false;

			
			document.querySelector("html").setAttribute("user-agent",res.body["user-agent"]);


			var href = ''
			
			var address = cookies.address ? cookies.address : ""
			var email = cookies.email ? cookies.email : ""

			console.log("address",address);

			if(cookies.email){

				if(OAuth3.teams){
					if(OAuth3.teams[address]){
						contenteditable = true;
						address = "";
					}else{
						href = ' href="/address/'+address.replace("0x", "#")+'"'
					}
				}
			}

			console.log("address",address);
			console.log("href",href);

			document.querySelector('#header label[for="nav"]').innerHTML = '<em>'+(email ? " " : "")+'</em>'

			document.querySelector("#header nav").innerHTML = '<ul>\
				<li>\
					<a '+href+'>'+address.replace("0x", "#")+'</a>\
				</li>\
				<li>\
					<a href="/docs/">Docs</a>\
				</li>\
				'+(address ? '<li><a href="'+OAuth3.host+'/logout">Logout</a></li>' : '<li><a href="/login/">Login</a></li>')+'\
			</ul>';

			var icon = blockies.create({seed: address ? address : ""});

			document.querySelector('#header label[for="nav"]').appendChild(icon);


			
			var host = window.location.host;

			if(OAuth3.localhost){
				host = OAuth3.localhost;
			}
			
			var host_flag = "#tag "+host+" ";
			var pathname = window.location.pathname;
			var search = window.location.search;
			var hash = window.location.hash;
			
			if(pathname){
				host_flag += pathname;
			}
			
			if(search){
				host_flag += search;
			}
			
			if(hash){
				host_flag = host_flag.replace("#tag", hash);
			}
			
			
			OAuth3.submit = function($form, callback){
				var draggable = $form.getAttribute("draggable") ? JSON.parse($form.getAttribute("draggable")) : false;
				var contenteditable = $form.getAttribute("contenteditable") ? true : false;

				if(contenteditable){
					var url = new URL($form.getAttribute("cc"));
					var Cc = url.pathname+url.search+url.hash;
					var To = $form.getAttribute("to");

					var Client = $form.getAttribute("client");


					
					var files = {};
					var links = {};
					
					var $fields = document.querySelectorAll('field[contenteditable="true"]');
					var $heading = $form.querySelector('field.heading h0');
					
					if($heading.getAttribute("link")){
						links[$form.id] = $heading.getAttribute("link");
					}

					var rows = [];
					var form_file;
					var form_row = {
						id : $form.id,
						to : To == Client ? "form" : To,
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

					if($started.value && $expired.value){
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

					if(OAuth3.localhost){
						cc_url = "http://"+OAuth3.localhost+window.location.pathname+window.location.search;
					}

					// 값 전송
					var request = {
						method : "POST",
						url : OAuth3.host,
						query : {
							to : "form",
							cc : cc_url
						},
						body : {
							rows : rows
						}
					}

					var response = function(res){
						var contenteditable = false;

						var cookies = JSON.parse(res.body.cookies);

						if(cookies.email){
							if(OAuth3.teams){
								if(OAuth3.teams[cookies.email]){
									contenteditable = true;
								}
							}
						}

						var rows = res.body.rows;

						var date = new Date();
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
									// console.log(resp);
								});
							}
						}

						if(callback){
							callback(response);
						}
					}

					try{
						OAuth3.fetch(request, response);
					}catch(err){
						// console.log("저장 에러 err",err);
					}
				}else{
					var url = new URL($form.getAttribute("cc"));
					
					var Flag = "";

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

						host_flag = "#tag "+host+" ";

						if(_url.pathname){
							host_flag += _url.pathname;
						}
						
						if(_url.search){
							host_flag += _url.search;
						}
						
						if(_url.hash){
							host_flag = host_flag.replace("#tag", _url.hash);
						}
					}

					var Cc = url.pathname+url.search+url.hash;

					var rows = [{
						id : $form.id,
						to : $form.getAttribute("to"),
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

					for(var i = 0; i < len; i++){
						var $field = $fields[i];

						var type = $field.getAttribute("type");

						var id = $form.id+" "+$field.id;

						if(i){
							var $item = $field.querySelectorAll("item");

							for(var o = 0; o < $item.length; o++){
								if($item[o].getAttribute("checked") || $item[o].getAttribute("readonly") || $item[o].getAttribute("check")){
									var subject = "";

									if(contenteditable){
										subject = $item[o].textContent;
									}else{
										subject = $item[o].getAttribute("contenteditable") ? $item[o].textContent : "";
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

					var cc_url = window.location.href;

					if(OAuth3.localhost){
						cc_url = "http://"+OAuth3.localhost+window.location.pathname+window.location.search;
					}

					// 값 전송
					var request = {
						method : "POST",
						url : OAuth3.host+"/",
						query : {
							to : "form",
							cc : cc_url
						},
						body : {
							rows : rows
						}
					}

					if(Object.keys(body).length){
						for(var prop in body){
							if(body.hasOwnProperty(prop)) {
								request.body[prop] = body[prop];
							}
						}
					}

					var response = function(res){
						if(callback){
							callback(res);
						}
					}

					OAuth3.fetch(request, response);
				}
			}
		}

		OAuth3.fetch(request, response);

		if(!OAuth3.Table){
			getTable();
		}
	}
})();