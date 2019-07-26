# Code Samples

This folder contains an extensive collection of Hazelcast Node.js Client code samples, which helps you to learn how to use Hazelcast features. The following lists the various events are fired and describes how you can add event listeners.

**cluster_events/** —  Folder including the samples to Cluster Events. These are Membership Listener, Distributed Object Listener and Lifecycle Listener. 
    
   - **membership_listener.js** — Listening to membership events.

   - **distributed_object_listener.js** — Listening to distributed object events.

   - **lifecycle_listener.js** — Listening to lifecycle events of the Hazelcast instance.

**data_structures_events/** —  Folder including the samples to Distributed Data Structures Events. These are Map Listener, Entry Listener, Item Listener and Message Listener.

   - **map_entry_listener.js** — Listening to map events.

   - **item_listener/** — Listening to item events.
   
       - **item_listener_list.js** — Listening to list item events.
       
       - **item_listener_set.js** — Listening to set item events.
        
       - **item_listener_queue.js** — Listening to queue item events.

   - **message_listener.js** — Listening to message events using reliable topic.
