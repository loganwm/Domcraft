var CreateMinecraftWall =
(function()
{
	var block_lookup_table =
	{
		0: { css: "block-air", break_interval: 0, transparent: true },
		1: { css: "block-stone", break_interval: 1000, transparent: false },	
		2: { css: "block-grass", break_interval: 200, transparent: false },
		3: { css: "block-dirt", break_interval: 200, transparent: false },	
		4: { css: "block-cobblestone", break_interval: 200, transparent: false },
		5: { css: "block-planks", break_interval: 300, transparent: false },
		7: { css: "block-bedrock", break_interval: 99999999999, transparent: false },
		10: { css: "block-lava", break_interval: 0, transparent: false },
		12: { css: "block-sand", break_interval: 150, transparent: false },
		13: { css: "block-gravel", break_interval: 200, transparent: false },
		14: { css: "block-goldore", break_interval: 1000, transparent: false },
		15: { css: "block-ironore", break_interval: 1000, transparent: false },
		16: { css: "block-coalore", break_interval: 1000, transparent: false },
		17: { css: "block-wood", break_interval: 300, transparent: false },
		18: { css: "block-leaves", break_interval: 75, transparent: true }
	};

	function create_block_wall(map, tile_size)
	{
		/* will store blocks indexed z,y,x */
		var blocks = {};	
	
		var wall = $("<div></div>");
		wall.css("width", map.width * tile_size);
		wall.css("height", map.height * tile_size);
		wall.css("padding", "0px");
		wall.css("margin", "0px");
		wall.css("position", "absolute");
	
		/* create block break overlay */
		var overlay = $("<div></div>");
		overlay.css("width", tile_size);
		overlay.css("height", tile_size);
		overlay.css("padding", "0px");
		overlay.css("margin", "0px");
		//overlay.css("background-color", "#ff0000");
		overlay.css("position", "inherit");
		overlay.css("left", tile_size);
		overlay.css("top", tile_size);
		overlay.css("z-index", 100);

		wall.append(overlay);


		/* stores setTimeout id */
		var break_task = -1;
		var breaking = false;
		
		var break_closure = function(x,y,z, break_counter)
		{
			var sender = blocks[z][y][x].element;
		
			if (break_counter > 0)
			{
				if (!breaking) { overlay.css("background", "none"); return; };
					overlay.css("background", "url(\"blocks-" + tile_size + ".png\") -" + ((9-break_counter) * tile_size) + "px -" + (15 * tile_size) + "px");

				break_task = setTimeout(function(){break_closure(x,y,z, break_counter-1)}, block_lookup_table[blocks[z][y][x].block_id].break_interval);
			}
			else
			{
				console.log("broken");

				/* kill click binding */
				console.log(sender);
				//sender.unbind();

				breaking = false;
				
				set_block_id(x,y,z,0);
				overlay.css("background", "none");
			}
			
			return;
		};
	
		var lava_animation = function(frame)
		{
			var prev_frame = frame-1; if (frame == 1) { prev_frame = 5; }
		
			$(".block-lava-" + tile_size).removeClass("block-lava-"+tile_size+"-"+prev_frame).addClass("block-lava-"+tile_size+"-"+frame);
		
			if (frame == 5)
				setTimeout(function(){lava_animation(1)}, 200);
			else
				setTimeout(function(){lava_animation(frame+1)}, 200);
		};
		
		setTimeout(function(){lava_animation(1)}, 200);

		var set_block_id = function(x, y, z, block_id)
		{
			var element = blocks[z][y][x].element;
			blocks[z][y][x].block_id = block_id;
			
			element.removeClass();
			element.addClass("block");
			element.addClass("block-" + tile_size);
			element.addClass(block_lookup_table[block_id].css + "-" + tile_size);
			
			/* if air, reset light level */
			//if (block_id == 0) { set_block_light(x,y,z,10); }

		};



		$(document).mouseup(function(event)
		{
			overlay.css("background", "none");
		
			/* cancel any pending break timers */		
			clearTimeout(break_task);
			breaking = false;
		
			overlay.hide();
		
			/* reset overlay breaking data */
			overlay.data("breaking",false);
		});


		wall.mousedown(function(event)
		{
			console.log(event.pageX);
			console.log(event.pageY);
			
			var click_x = event.pageX - this.offsetLeft;
			var click_y = event.pageY - this.offsetTop;
			
			console.log(x);
			console.log(y);
			
			console.log("poop");

			var block_x = Math.floor(click_x / tile_size);
			var block_y = Math.floor(click_y / tile_size);
			console.log(block_x + "," + block_y);

			//var sender = $(blocks[0][block_x][block_y].element);
			
			overlay.css("top", block_y*tile_size);
			overlay.css("left", block_x*tile_size);
			
			/* set overlay breaking data */
			breaking = true;
			overlay.show();
			
			
			/* see how deep that rabbithole goes */
			var depth = 0;
			
			for (var traversal = 0; traversal < map.depth; traversal++)
			{
				if (blocks[traversal][block_y][block_x].block_id != 0)
				{
					console.log(traversal);
					depth = traversal;
					continue;
				}
			}
			
			
			/* block breaking closure - written with the express purpose to drive Mitchell Thompson into a catatonic state
			   additionally, yes, there are better ways of doing this, but when in rome, do as the romans do and Make Mitchell cry. */
			
			break_closure(block_x,block_y,depth, 9);
		});		



		for (var depth = 0; depth < map.depth; depth++)
		{
			/* setup depth index */
			blocks[depth] = {};
		
			var content_layer = $("<div></div>");
			content_layer.attr("id", "layer-" + depth);
			content_layer.css("width", map.width * tile_size);
			content_layer.css("height", map.height * tile_size);
			content_layer.css("padding", "0px");
			content_layer.css("margin", "0px");
			content_layer.addClass("block-container");

			var shadow_layer = $("<div></div>");
			shadow_layer.css("width", map.width * tile_size);
			shadow_layer.css("height", map.height * tile_size);
			shadow_layer.css("padding", "0px");
			shadow_layer.css("margin", "0px");
			shadow_layer.addClass("block-shadow-container");
			shadow_layer.addClass("overlay");

			console.log(depth);
	
			for (var y = 0; y < map.height; y++)
			{
				/* setup y index */
				blocks[depth][y] = {};

				for (var x = 0; x < map.width; x++)
				{
					/* setup y index */
					blocks[depth][y][x] = {};

					var block = $("<div></div>");
					var block_id = map.data[depth][(y * map.width) + x];
					var block_shadow = $("<div></div>");

					block_shadow.addClass("block-" + tile_size);
					
					console.log(blocks);
					blocks[depth][y][x].element = block;
					blocks[depth][y][x].light_element = block_shadow;

					set_block_id(x,y,depth,block_id);


					block_shadow.addClass("block-" + tile_size);
					if (block_id != 0)
					{
						block_shadow.addClass("block-shadow");
					}
					
					
					content_layer.append(block);
					shadow_layer.append(block_shadow);
				}
			}

			wall.append(content_layer);
			wall.append(shadow_layer);

		}

		return wall;
	}

	return create_block_wall;
})();