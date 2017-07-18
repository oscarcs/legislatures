window.onload = function() {
    let app = new Vue({
        el: '#vue',
        data: {
            message: "",

            // Group containg the seat shapes:
            seatGroup: null,
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

            },

            /**
             * Generate a props object based on the current state of the 
             * bindings on the Vue-linked form.
             */
            generateProps: function() {
                return {
                    /**
                     * The arrangment of seating in the legislature, based on
                     * the typologies in XML's architecure book 'Parliament'.
                     * Possible values:
                     * "opposing": Opposing benches, e.g. United Kingdom.
                     * "semicircle": Semicircular, e.g. European Union.
                     * "horseshoe": e.g. New Zealand.
                     * "circle": e.g. Jordan, Slovenia.
                     * "classroom": Consecutive rows, e.g. China.
                     */ 
                    typology: "",

                    /**
                     * Number of members / seats in the legislature.
                     */
                    numberOfSeats: 0,

                    /**
                     * Seat shape. XML's book uses squares, while Wikipedia uses
                     * circles.
                     * Possible values: "circle", "square"
                     */
                    seatShape: "",

                    /**
                     * Array of objects describing the parties in the 
                     * legislature. 
                     */
                    parties: []
                };
            },

            /**
             * Generate a parties object based on the current state of the 
             * bindings on the Vue-linked form.
             */
            generateParties: function() {

            },

            /**
             * Draw the legislature based on a props object.
             */
            drawLegislature: function(props) {
                switch (props.typology) {
                    case "opposing":
                        
                        break;

                    case "semicircle":

                        break;

                    case "horseshoe":

                        break;

                    case "circle":

                        break;

                    default:
                        throw `Typology '${props.typology}' not recognized.`;
                }
            },

            /**
             * 
             */
            drawOpposing: function(props) {
                let group;

                

                return group;
            },

            /**
             * Draw an individual seat.
             * seatShape: shape of each seat.
             * 
             */
            drawSeat: function(seatShape, centre, size) {
                let shape;

                switch(seatShape) {
                    case 'circle':
                        let radii = new Point(size, size);
                        shape = new Path.Circle(centre, radii);
                        break;

                    case 'square':
                        let b = new Point(
                            centre.x - size / 2, 
                            centre.y - size / 2
                        );
                        let a = new Point(
                            centre.x + size / 2, 
                            centre.y + size / 2
                        );
                        shape = new Path.Rectangle(a, b);
                        break;

                    default:
                        throw `Shape '${seatShape}' not recognized.`;
                }

                return shape;
            }
        }
    });

}