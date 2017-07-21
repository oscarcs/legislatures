window.onload = function() {
    let app = new Vue({
        el: '#vue',
        data: {
            // Typology select options
            typologies: [
               { text: "Opposing", value: "opposing" }, 
               { text: "Semicircle", value: "semicircle" }, 
               { text: "Horseshoe", value: "horseshoe" }, 
               { text: "Circle", value: "circle" }, 
               { text: "Classroom", value: "classroom" }, 
            ],

            typology: "opposing",

            numberOfSeats: 0,

            useParties: true,
            parties: [],

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

            onSortable: function(event) {
                this.list.splice(
                    event.newIndex, 
                    0, 
                    this.list.splice(event.oldIndex, 1)[0]
                );
            },

            /**
             * Generate the legislature.
             */
            generate: function() {
                let props = this.generateProps();
                let group = this.drawLegislature(props);

                console.log('Generating...');
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
                    typology: this.typology,

                    /**
                     * Number of members / seats in the legislature.
                     */
                    numberOfSeats: this.numberOfSeats,

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
                    parties: this.parties
                };
            },

            /**
             * Add a political party.
             */
            addParty: function() {
                this.parties.push({
                    name: "",
                    numberOfMembers: 0,
                    color: null
                });
            },

            /**
             * Draw the legislature based on a props object.
             */
            drawLegislature: function(props) {
                let group;
                
                switch (props.typology) {
                    case "opposing":
                        group = this.drawOpposing(props);
                        break;

                    case "semicircle":
                        group = this.drawSemicircle(props);
                        break;

                    case "horseshoe":
                        group = this.drawHorseshoe()
                        break;

                    case "circle":
                        group = this.drawCircle();
                        break;

                    default:
                        throw `Typology '${props.typology}' not recognized.`;
                }

                return group;
            },

            /**
             * Draw seats arranged as two opposing benches.
             */
            drawOpposing: function(props) {
                let group;

                // Determines the number of rows to columns 
                // (1 row : RATIO columns)
                const RATIO = 3.75;
                const SEAT_SPACING = 5;
                const SEAT_SIZE = 20; 

                // Calculate the number of rows and columns of seats for the 
                // opposing benches.
                let rows = Math.round(Math.sqrt(props.numberOfSeats / RATIO));
                let columns = Math.round(props.numberOfSeats / rows);

                // Determine which parties are on which bench:
                let leftBenchParties = [props.parties[0]];
                let rightBenchParties = [props.parties[1]];

                // Draw the left bench. Opposition MPs sit here.
                leftBench = [];

                // Variables to track current drawing state.
                let numberSeatsDrawn = 0;
                let currentColor = "black";

                for (let i = 0; i < columns; i++) {
                    for (let j = 0; j < rows; j++) {                        

                        leftBench.push(this.drawSeat('square', ));

                        numberSeatsDrawn++;
                    }
                }

                // Draw the 'right bench'. Govt MPs sit here.

                return group;
            },

            /**
             * Draw seats arranged in a semicircle.
             */
            drawSemicircle: function(props) {
                let group;

                

                return group;
            },

            /**
             * Draw seats in two opposing benches, linked by a half-circle.
             */
            drawHorseshoe: function(props) {
                let group;

                

                return group;
            },

            /**
             * Draw seats arranged in a circle.
             */
            drawCircle: function(props) {
                let group;

                

                return group;
            },


            /**
             * Draw an individual seat.
             * seatShape: Shape of the seat.
             * color: color to fill the seat with.
             * centre: Centre point of the seat.
             * size: Radius of the seat. 
             */
            drawSeat: function(seatShape, color, centre, size) {
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

                shape.fillColor = color;

                return shape;
            }
        }
    });

}