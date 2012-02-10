SC.initialize({
  client_id: "62bcdc7045128282e8110e13d0019f30",
  redirect_uri: "http://www.spencerkiser.com/soundcloud/callback.html",
});

$.scPlayer.defaults.onDomReady = null;

$(document).ready(function() {

  
  if (typeof(localStorage) == 'undefined') {
    alert('Soundcloud Playlister requires a browser that supports HTML5 localStorage.  Please upgrade your browser and try again.');
  } else { 
    
    //PREPARE FRONT END
    showHomePage();

    //HANDLE SEARCH FORM SUBMISSION
    $('form#soundcloud_search').submit(function(e) {
    //$('#search_button').click(function(e) {
      e.preventDefault();

      showTrackSearchPage();
      var search_string = "";
      search_string = $('input#search_string').val();
      
      // MAKE JSON SEARCH REQUEST
      $.getJSON("http://api.soundcloud.com/tracks.json?",
        {
          client_id: "62bcdc7045128282e8110e13d0019f30",
          q: search_string
        },
        function(data) {
          var items_array = [];
          var items = "";
          
          // LOOP THROUGH RESULTS AND PREPARE THEM FOR DISPLAY    
          $.each(data, function(key,val) {
            //items_array.push('<a href="' + val.uri + '" class="sc-player">' + val.title + '</a>');
            items_array.push('<div class="player"><span class="add" name="' + val.uri + '" title="' + val.title + '">+</span><br /><a href="' + val.uri + '" class="sc-player">' + val.title + '</a></div>');
          });

          //DELETE THE RESULTS ON THE SCREEN IF THERE
          if ($('ul#search_results').length != 0) {
            $('ul#search_results').empty();
          }
          
          items = items_array.join('');
          
          $('ul#search_results').append(items);
          $('a.sc-player').scPlayer();

          //DISPLAY THE FORM TO ADD A TRACK IF USER CLICKS ADD
          $(".add").click(function() {
            $("div#add_track_form").show();
            $('html,body').animate({
              scrollTop: $("div#add_track_form").offset().top
              }, 2000);
            var trackUrl = $(this).attr("name");
            var trackTitle = $(this).attr("title");
            trackTitle = trackTitle.slice(0,(trackTitle.length));
            //alert("name: " + trackTitle + "\nurl: " + trackUrl );
            $("form#add_track").append('<input type="hidden" name="track_url" value="' + trackUrl + '">'); 
            $("div#add_track_form").before('<p class="info">Add "' + trackTitle + '" to a playlist.</span></p>');

            //HANDLE ADD TRACK FORM
            $('form#add_track').submit(function(e) {
              e.preventDefault;
              var trackUrl = $("input[name='track_url']").val();
              var tagsArray = new Array();
              var trackTags = $("input[name='tag_list']").val();
              var playlistKey = $("select#playlist_select").val();
              tagsArray = trackTags.split(',');
              //REMOVE SPACES FROM BEGINNING AND END OF TAG STRINGS
              $.each(tagsArray, function(index, value) {
                tagsArray[index] = $.trim(value);
              });

              
                
              //ADD TAGS TO TRACK URL, TO BE PARSED AND REMOVED WHEN RETRIEVING
              trackUrl = trackUrl + "?" + $.param({tags: tagsArray});
              //GET THE CURRENT PLAYLIST ENTRY
              var playlist = localStorage.getItem(playlistKey);
              //ADD THE CURRENT TRACK TO IT
              var newPlaylist = playlist + "|" + trackUrl;

              localStorage.setItem(playlistKey, newPlaylist);
              showHomePage();

            });
          });
        });
      });
    } 
  });
  
  function prepareAddTrackForm() {

    //GET THE TRACK URL FROM THE CLICKED +
    var selectedTrackUrl = $(this).attr("name");

    //POPULATE THE OPTIONS FOR PLAYLIST SELECT
    var optionList = '<option value="new">Select a Playlist</option>';
    var i = 0;
    var listLength = localStorage.length;
    
    //PULL PLAYSLIST TITLES FROM LOCALSTORAGE
    for (i = 0; i < listLength; i++) {
      var itemKey = localStorage.key(i);
      var values = localStorage.getItem(itemKey);
      values = values.split("|");
      var playlistTitle = values[0];
      optionList += '<option value="' + itemKey + '">' + playlistTitle + '</option>' 
    }
    
    //ADD PLAYLIST OPTIONS TO FORM
    $('#playlist_select').html(optionList);
  }
  
  
  function displayPlaylists() {
    var playlistList = "";
    var i = 0;
    var listLength = localStorage.length;
    
    //LOOP THROUGH PLAYLISTS
    for (i = 0; i < listLength; i++) {
      var itemKey = localStorage.key(i);
      var values = localStorage.getItem(itemKey);
      values = values.split("|"); // PIPE DELIMITED
      var playlistTitle = values[0];
      var playlistDescription = values[1];
      var trackListArray = new Array();
      tracklistArray = values.slice(2,values.length); // TRACKS WERE ADDED AFTER PLAYLIST TITLE AND DESCRIPTION
      var tracklist = "";

      //LOOP OVER TRACKS
      $.each(tracklistArray, function(index, value) {
        var url = value.split('?'); // GET THE BASE URL
        var tags = new Array();
        tags = url[1].split('&'); //EVERYTHING AFTER THE ? IS THE TAG LIST

        //LOOP OVER THE TAGS
        $.each(tags, function(index, value) {
          tags[index] = '<span class="tag">' + value.replace('tags%5B%5D=','').replace('+',' ') + '</span>'; //MAKE THE TAG LIST (NEED BETTER URI DECODING)
        });
        tracklist += '<div class="player"><a href="' + url[0] + '" class="sc-player">' + url[0] + '</a><p>' + tags.join('  ') + '</p></div>';//MAKE THE TRACK LIST
      });
        if (tracklist == '') {
          tracklist = '<div class="player"><p>No tracks yet. Search for tracks and add them to this playlist.</p></div>';
        }
      playlistList += '<li><div class="playlist_info"><span class="playlist_title">' + playlistTitle + '</span>&nbsp;<span class="delete" name="' + itemKey + '">&times;</span><br />' + '<span class="playlistDesc">' + playlistDescription + '</span></div>' + tracklist + '</li>'; 
    }

    if (playlistList == '') {
      playlistList = '<li class="empty">You have not created any playlists</li>'
    }
    
    playlistList += '<li><div class="add_playlist"><a href="#">Create a new playlist </a><span class="add_playlist">+</span></div></li>'


    $('#playlists').html(playlistList);
    $('a.sc-player').scPlayer();
    $('div.add_playlist').click(function(e) {
      e.preventDefault();
      $('form#create_playlist').show();
    });

    //DELETE A PLAYLIST 
    $(".delete").click(function() {
      var answer = confirm("Are you sure you want to do delete this playlist?");
      
      if (answer) {
        var itemKey = $(this).attr("name");
        localStorage.removeItem(itemKey);
        displayPlaylists();
      }
    });
  }      

  function showHomePage() {
    $("div#home").show();
    $("div#search").hide();

    displayPlaylists(); // LOAD PLAYLISTS

    //HANDLE CREATE PLAYLIST FORM
    $('#create_playlist').submit(function() {
      var newDate = new Date();
      var playlistId = newDate.getTime();
      var playlistData = new Array();
      var playlistTitle = $("input[name='playlistTitle']").val();
      var playlistDescription = $("input[name='playlistDescription']").val();
      
      playlistTitle = playlistTitle.replace(/(<([^>]+)>)/ig, "");
      playlistData.push(playlistTitle);
      playlistData.push(playlistDescription);
    
      if (playlistTitle != "") {
        try {
          localStorage.setItem(playlistId, playlistData.join('|'));
        } catch (e) {
          if (e == QUOTA_EXCEEDED_ERR) {
            alert('You have exceeded your quota for local storage!');
          }
        }
      } else {
        alert('Please provide a playlist title.');
      }
    });

  }
  
  function showTrackSearchPage() {
    $("div#home").hide();
    $("div#search").show();

    prepareAddTrackForm();
  }

