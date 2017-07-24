window.onload = function() {
    window.app = new Vue({
        el: '#vue',
        data: {

            jurisdictionName: "",

            legislatureName: "",

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
            partyCounter: 1, // Track names like 'Party 1', 'Party 2' etc.

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
                var a = new Point(0, 0);
                var b = new Point(640, 480)
                //var shape = new Path.Rectangle(a, b);
                //shape.fillColor = "red";
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
             * Generate the legislature diagram.
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
                const colors = [
                    "#00529F",
                    "#D82A20",
                    "#098137",
                    "#FDE401",
                    "#501557",
                    "#F5621E",
                    "#00AEEF"
                ];
                let color = "#FFFFFF";
                if (this.partyCounter <= colors.length) {
                    color = colors[this.partyCounter - 1];
                } 

                this.parties.push({
                    name: `Party ${this.partyCounter++}`,
                    numberOfMembers: 0,
                    color: color,

                    // Display variables
                    collapsed: false
                });
            },

            /**
             * Generate a random party name.
             * @@TODO: Make this much more comprehensive.
             */
            generatePartyName: function() {
                const prefixes = [
                    'Labour',
                    'Democratic',
                    'Progressive',
                    'Conservative',
                    'National',
                    'Liberal',
                    'Centrist',
                    'Social Democratic',
                    'United',
                    'Green',
                    'Christian Democratic',
                    'Islamic',
                    'Agrarian',
                    'Communist',
                    'Socialist',
                    'Liberation',
                    'Justice',
                    'People\'s',
                    'Patriotic',
                    'Libertarian',
                    'Pirate',
                    'Civic',
                ];

                const suffixes = [
                    ' Front',
                    ' Alliance',
                    ' Coalition',
                    ' League',
                    ' National Movement',
                    ' Citizens\' Movement',
                    ' Movement',
                    ' Action Party',
                    ' Reform Party',
                    ' Union',
                    ' Association'
                ];

                let str = '';
                let hasJurisdiction = 
                    this.jurisdictionName !== "" && 
                    this.jurisdictionName !== null;
                let frontJurisdiction = false;

                if (Math.random() > 0.6) {
                    str += 'The ';
                }
                else if (hasJurisdiction && Math.random() > 0.7) {
                    str += `${this.jurisdictionName} `;
                    frontJurisdiction = true;
                }
                else if (Math.random() > 0.85) {
                    str += 'New ';
                }

                let p = Math.floor((Math.random() * prefixes.length));
                str += prefixes[p];

                if (Math.random() > 0.35) {
                    let s = Math.floor((Math.random() * suffixes.length));
                    str += suffixes[s];
                }
                else {
                    str += ' Party';
                }

                if (hasJurisdiction) {
                    if (Math.random() > 0.8 && !frontJurisdiction) {
                        if (Math.random() > 0.85) {
                            str += ` ${this.jurisdictionName}`;
                        }
                        else {
                            str += ` of ${this.jurisdictionName}`;
                        }
                    }
                }

                return str;
            },

            /**
             * Delete a political party.
             */
            deleteParty: function(party) {
                this.parties = this.parties.filter(x => x !== party);
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
                
                // Determines the number of rows to columns 
                // (1 row : RATIO columns)
                // const RATIO = 2.75;
                const RATIO = 3.75;

                const SEAT_SPACING = 5;
                const SEAT_SIZE = 20; 

                // Get the total number of seats and the seat-color mapping 
                // for each parliamentary group / side of the chamber.
                function getTotalsBySide(parties) {
                    let total = 0;
                    let seats = [];

                    for (let i = 0; i < parties.length; i++) {
                        total += parties[i].numberOfMembers;
                        seats.push({ 
                            num: parties[i].numberOfMembers,
                            color: parties[i].color
                        });
                    }
                    return { total: total, seats: seats };
                }

                // Get the color of the next seat. We decrement the nunber of
                // seats in each parliamentary group each time. 
                function getNextColor(seatsByParty) {
                    let i = 0;
                    while (seatsByParty[i].num === 0) {
                        i++;
                    }

                    seatsByParty[i].num--;
                    return seatsByParty[i].color;
                }

                // Draw a bench.
                let drawSeat = this.drawSeat;
                function drawBench(
                    rows, cols, // Rows and cols of seats.
                    offset_x, offset_y, // Starting point for drawing.
                    total, seatsByParty, group // Bench variables.
                ) {
                    let numberSeatsDrawn = 0;
                    let currentColor = "black";

                    for (let i = 0; i < cols; i++) {
                        for (let j = 0; j < rows; j++) {                        
                            
                            if (numberSeatsDrawn >= total) break;

                            let center = new Point(
                                i * (SEAT_SIZE + SEAT_SPACING), 
                                j * (SEAT_SIZE + SEAT_SPACING)
                            );
                            center.x += offset_x;
                            center.y += offset_y;

                            currentColor = getNextColor(seatsByParty);

                            group.push(
                                drawSeat(
                                    'square', 
                                    currentColor, 
                                    center, 
                                    SEAT_SIZE
                                )
                            );

                            numberSeatsDrawn++;
                        }
                    }
                }

                // Determine which parties are on which bench:
                let rightBenchParties = [
                    props.parties[0],
                    props.parties[3],
                    props.parties[4],
                    props.parties[5],
                ];
                let leftBenchParties = [
                    props.parties[1], 
                    props.parties[2],
                    props.parties[6],
                ];

                // Variables for the left bench:
                let leftBench = [];
                let left = getTotalsBySide(leftBenchParties);
                console.log(left.total, left.seats);

                // Calculate the number of rows and columns of seats for the 
                // opposing benches.
                let rows = Math.ceil(Math.sqrt(left.total / RATIO));
                let cols = Math.ceil(left.total / rows);

                // Draw the left bench. Opposition MPs sit here.
                drawBench(rows, cols, 40, 40, left.total, left.seats, leftBench);


                // Variables for the right bench:
                let rightBench = [];
                let right = getTotalsBySide(rightBenchParties);
                console.log(right.total, right.seats);

                cols = Math.ceil(right.total / rows);

                // Draw the right bench. Govt MPs sit here.
                drawBench(rows, cols, 40, 240, right.total, right.seats, leftBench);

                let group = new Group(leftBench);
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
             * center: Center point of the seat.
             * size: Radius of the seat. 
             */
            drawSeat: function(seatShape, color, center, size) {
                let shape;

                console.log(center);

                switch(seatShape) {
                    case 'circle':
                        let radii = new Point(size, size);
                        shape = new Path.Circle(center, radii);
                        break;

                    case 'square':
                        let b = new Point(
                            center.x - size / 2, 
                            center.y - size / 2
                        );
                        let a = new Point(
                            center.x + size / 2, 
                            center.y + size / 2
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