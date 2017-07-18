window.onload = function() {
    let app = new Vue({
        el: '#vue',
        data: {
            message: ""
        },

        created: function() {
            // Setup Paperjs:
            paper.install(window);
            paper.setup('display');
            
            var tool = new Tool(); 
            tool.activate();

            // Set event handlers:
            paper.view.onFrame = this.tick;
            tool.onKeyDown = this.onKeyDown;
            tool.onKeyUp = this.onKeyUp;

            this.initialize();
        },

        methods: {

            /**
             * Set up the scene.
             */
            initialize: function() {
                var a = new Point(40, 40);
                var b = new Point(20, 20)
                var shape = new Path.Rectangle(a, b);
                shape.fillColor = "red";
            },

            /**
             * Main draw call. 
             */
            tick: function(event) {
                var dt = event.delta; 
            },
            
            onKeyDown: function() {

            },
            
            onKeyUp: function() {

            }
        }
    });

}