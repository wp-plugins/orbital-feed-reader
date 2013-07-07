<?php

require_once 'backend.php';


# create the database tables.
function orbital_install_db()
{
  global $wpdb;
  global $orbital_db_version;
  global $orbital_db_version_opt_string;
  global $tbl_prefix;
  $charset_collate = '';

  if ( ! empty( $wpdb->charset ) )
    $charset_collate = "DEFAULT CHARACTER SET $wpdb->charset";
  if ( ! empty( $wpdb->collate ) )
    $charset_collate .= " COLLATE $wpdb->collate";

  require_once(ABSPATH. 'wp-admin/includes/upgrade.php');
  //feeds
  $table_name = $wpdb->prefix.$tbl_prefix."feeds";

  $sql = "CREATE TABLE " . $table_name ." (
    id integer NOT NULL AUTO_INCREMENT,
    feed_url text NOT NULL,
    feed_name text NOT NULL,
    icon_url varchar(250) NOT NULL DEFAULT '',
    site_url varchar(250) NOT NULL DEFAULT '',
    last_updated datetime DEFAULT 0,
    last_error varchar(250) NOT NULL DEFAULT '',
    UNIQUE KEY id (id)
  ) $charset_collate;";
  dbDelta($sql);
  _log("Added $table_name");
  //User_feeds
  //This is the users view of a feed. 
  //Any value here overrides the feeds value.
  $table_name = $wpdb->prefix.$tbl_prefix."user_feeds";

  $sql = "CREATE TABLE " . $table_name ." (
    id integer NOT NULL AUTO_INCREMENT,
    owner BIGINT NOT NULL, 
    feed_id integer NOT NULL,
    feed_name text NOT NULL,
    icon_url varchar(250) ,
    site_url varchar(250) ,
    unread_count integer NOT NULL,
    private bool NOT NULL DEFAULT false,
    UNIQUE KEY id (id)
  ) $charset_collate;";
  dbDelta($sql);
  _log("Added $table_name");
  

  //user entries
  //TODO add the foreign key refs from ref id to entries id and feed id
  //TODO add starred
  $table_name = $wpdb->prefix.$tbl_prefix."user_entries";

  $sql = "CREATE TABLE " . $table_name ." (
    id integer NOT NULL AUTO_INCREMENT,
    entry_id integer NOT NULL,
    feed_id integer,
    orig_feed_id integer,
    owner_uid integer NOT NULL,
    marked bool NOT NULL DEFAULT false,
    isRead bool NOT NULL DEFAULT false,
    UNIQUE KEY id (id)
  ) $charset_collate;";
  dbDelta($sql);
  _log("Added $table_name");

  //entries
  $table_name = $wpdb->prefix.$tbl_prefix."entries";
  _log("Adding $table_name");

  $sql = "CREATE TABLE " . $table_name ." (
    id integer NOT NULL AUTO_INCREMENT,
    feed_id integer,
    title text NOT NULL,
    guid varchar(255) NOT NULL UNIQUE,
    link text NOT NULL,
    updated datetime NOT NULL,
    content longtext NOT NULL,
    content_hash varchar(250) NOT NULL,
    no_orig_date bool NOT NULL DEFAULT 0,
    entered datetime NOT NULL,
    author varchar(250) NOT NULL DEFAULT '',
    UNIQUE KEY id (id)
  ) $charset_collate;";
  dbDelta($sql);
  _log("Added $table_name");
  add_option($orbital_db_version_opt_string,$orbital_db_version);
}
//TODO load in everything with admin as owner, 
# load all the first installation data in.
function orbital_install_data(){
  global $wpdb;
  global $tbl_prefix;
  global $current_user;
  $user_id = $current_user->ID;
  //install some sample feeds
  $feed = OrbitalFeeds::save(
  array(
  'feed_url'=>'http://www.morelightmorelight.com/feed/',
  //'feed_url'=>'http://localhost/morelightmorelight/feed',
  'site_url'=> 'http://www.morelightmorelight.com',
  'is_private'=>0,
  //'owner' => $current_user->ID,
  'feed_name' =>'More Light! More Light!'));
  
  $orbitalfeed = OrbitalFeeds::save(
  array(
    'feed_url' => 'http://mattkatz.github.com/Orbital-Feed-Reader/ditz/html/feed.xml',
    //'feed_url' => 'http://localhost/orbital/ditz/html/feed.xml',
    'site_url' => 'http://mattkatz.github.com/Orbital-Feed-Reader/', 
    'is_private'=>0,
    //'owner' => $current_user->ID,
    'feed_name' => 'Orbital Changes'));

  //Insert a sample entry
  OrbitalEntries::save(array(
    'feed_id'=> $orbitalfeed->feed_id,
    'title'=>'Welcome to Orbital!',
    'guid'=>'FAKEGUID',
    'link'=>'http://mattkatz.github.com/Orbital-Feed-Reader/welcome.html',//TODO 
    'updated'=>date ("Y-m-d H:i:s"),
    'content'=>"Here is where I'll put in some helpful stuff to look at",//TODO
    'entered' =>date ("Y-m-d H:i:s"),
    'author' => 'Matt Katz'
  ));
  $i = 0;
  //Insert a sample entry
  OrbitalEntries::save(array(
    'feed_id'=> $orbitalfeed->feed_id,
    'title'=>'Getting Started',
    'guid'=>'FAKEGUID' . $i++,
    'link'=>'http://mattkatz.github.com/Orbital-Feed-Reader/getting-started.html',//TODO 
    'updated'=>date ("Y-m-d H:i:s"),
    'content'=>"This is <b>your</b> Orbital Reader, a feed reading platform for WordPress. I'll handle polling all your favorite websites for new posts. I've put some favorite samples in the side bar on the right. You'll see those start getting populated with new posts.",//TODO
    'entered' =>date ("Y-m-d H:i:s"),
    'author' => 'Matt Katz'
  ));
  //Insert a sample entry
  OrbitalEntries::save(array(
    'feed_id'=> $orbitalfeed->feed_id,
    'title'=>'Keyboard Shortcuts',
    'guid'=>'FAKEGUID' . $i++,
    'link'=>'http://mattkatz.github.com/Orbital-Feed-Reader/getting-started.html',//TODO 
    'updated'=>date ("Y-m-d H:i:s"),
    'content'=>"You can mark entries as read and Orbital will remember for you. As you scroll down, just click on an entry to mark it as read.
    A better way to do this is to take your hand off the mouse and just click the 'j' key or the ⬇ key.
    Watch as you are taken to the next item to be read - we'll also mark it as something you've looked at.
    <p>Go ahead and try it now - see you at the next post.
    </p>    ",//TODO
    'entered' =>date ("Y-m-d H:i:s"),
    'author' => 'Matt Katz'
  ));
  //Insert a sample entry
  OrbitalEntries::save(array(
    'feed_id'=> $orbitalfeed->feed_id,
    'title'=>'More Keyboard Shortcuts',
    'guid'=>'FAKEGUID' . $i++,
    'link'=>'http://mattkatz.github.com/Orbital-Feed-Reader/getting-started.html',//TODO 
    'updated'=>date ("Y-m-d H:i:s"),
    'content'=>"<p>What else?</p>
    <p>
      <ul>
        <li>You can press 'u' to toggle whether an item is read or not.  </li>
        <li>'k' or ⬆ will go back to stuff you've already read. </li>
        <li>'o' will open up a new browser tab with the feed you are looking at.  </li>
      </ul>
    </p>
    ",//TODO
    'entered' =>date ("Y-m-d H:i:s"),
    'author' => 'Matt Katz'
  ));
  //Insert a sample entry
  OrbitalEntries::save(array(
    'feed_id'=> $orbitalfeed->feed_id,
    'title'=>'The feedlist',
    'guid'=>'FAKEGUID' . $i++,
    'link'=>'http://mattkatz.github.com/Orbital-Feed-Reader/getting-started.html',//TODO 
    'updated'=>date ("Y-m-d H:i:s"),
    'content'=>"
    <p>Over in the feed list on the right hand side, look for three icons:
      <ul>
        <li> ⟳ - this is the refresh icon. It will refresh the feed list if for some reason we aren't keeping it up to date.  </li>
        <li>
        + - Add a new feed. This brings up the subscriptions dialog, and I'll tell you more about that in a second.
        </li>
        <li>
        ✎ - Edit and manage your feeds. Rename them, set them as private or public, etc. 
        </li>
      </ul>
      Underneath you'll find a list of all your feeds, ready to click on. Click one to just see that or click All to drink from the firehose.
    </p>
    ",//TODO
    'entered' =>date ("Y-m-d H:i:s"),
    'author' => 'Matt Katz'
  ));
  //Insert a sample entry
  OrbitalEntries::save(array(
    'feed_id'=> $orbitalfeed->feed_id,
    'title'=>'Adding your own sites to monitor',
    'guid'=>'FAKEGUID' . $i++,
    'link'=>'http://mattkatz.github.com/Orbital-Feed-Reader/getting-started.html',//TODO 
    'updated'=>date ("Y-m-d H:i:s"),
    'content'=>"
    <p>
      I've started you out with some great feeds that I like, but you probably want to add your own. That's easy!
    </p>
    <p>
    On the feedlist click the '+'. There's two ways to go from here. 
    <ol>
      <li>
      If you just want to add a new favorite site, that's easy. Just copy the URL ('http://www.whatever.com') and put it in text box, then hit the 'Check a Url' button. I'll go to the site and try to figure out what feeds it provides and give you a chance to pick, then hit save.  If I can't find one (not all websites make it easy), no problem. Look for the words 'RSS', 'ATOM', 'Feed' or the feed icon.
      </li>
      <li>
      Are you coming from Google Reader or something like that? You can go to the bottom section and just upload your OPML file. I'll do my best to read that file and import all your feeds for you. If you've got a lot, please be chill - it's all happening on your browser.
      </li>
      </ol>
      </p>
    ",//TODO
    'entered' =>date ("Y-m-d H:i:s"),
    'author' => 'Matt Katz'
  ));
  //Insert a sample entry
  OrbitalEntries::save(array(
    'feed_id'=> $orbitalfeed->feed_id,
    'title'=>"Press This!",
    'guid'=>'FAKEGUID' . $i++,
    'link'=>'http://mattkatz.github.com/Orbital-Feed-Reader/getting-started.html',//TODO 
    'updated'=>date ("Y-m-d H:i:s"),
    'content'=>"
    <p>So the real benefit of the Orbital Feed Reader is that it should encourage you to write more! All this stuff in your feed reader is really just inspiration juice. So here's how we do that. Highlight the first sentence on this post and click the PressThis! link below. You'll see attribution and citation in a ready to edit Blog Post!</p>
    ",//TODO
    'entered' =>date ("Y-m-d H:i:s"),
    'author' => 'Matt Katz'
  ));
  //Insert a sample entry
  OrbitalEntries::save(array(
    'feed_id'=> $orbitalfeed->feed_id,
    'title'=>"That's it for now!",
    'guid'=>'FAKEGUID' . $i++,
    'link'=>'http://mattkatz.github.com/Orbital-Feed-Reader/getting-started.html',//TODO 
    'updated'=>date ("Y-m-d H:i:s"),
    'content'=>"
    <p>Try adding some of your favorite sites to get started. When you find something you like, click PressThis!</p>
    ",//TODO
    'entered' =>date ("Y-m-d H:i:s"),
    'author' => 'Matt Katz'
  ));

  $bb = OrbitalFeeds::save(
  array(
    'feed_url'=>'http://boingboing.net/feed/',
    //'feed_url'=>'http://localhost/boingboing/iBag',
    'site_url'=> 'http://boingboing.net',
    'is_private'=>0,
    //'owner' => $current_user->ID,
    'feed_name' => 'Boing Boing'));
  OrbitalFeeds::save(
  array(
    'feed_url'=>'http://feeds.feedburner.com/ButDoesItFloat?format=xml',
    //'feed_url'=>'http://localhost/boingboing/iBag',
    'site_url'=> 'http://butdoesitfloat.com',
    'is_private'=>0,
    //'owner' => $current_user->ID,
    'feed_name' => 'But does it float?'));
  OrbitalFeeds::save(
  array(
    'feed_url'=>'http://visitsteve.com/feed',
    //'feed_url'=>'http://localhost/boingboing/iBag',
    'site_url'=> 'http://visitsteve.com/',
    'is_private'=>0,
    //'owner' => $current_user->ID,
    'feed_name' => 'Steve Lambert, art etc.'));
}
/*
function orbital_uninstall_db()
{
  //We should remove the DB option for the db version
  delete_option('orbital_db_version');
  //TODO clean up all the tables
  global $wpdb;
  $sql = "DROP TABLE ". $wpdb->prefix.$tbl_prefix."feeds;";
  $wpdb->query($sql);

}*/

?>