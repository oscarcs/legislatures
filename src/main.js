window.onload = function() {
    window.app = new Vue({
        el: '#vue',
        data: {

            /**
             * Data:
             */

            // General settings:
            jurisdictionName: "",
            legislatureName: "",
            typology: "opposing",
            numberOfSeats: 0,

            // Parties and groups:
            useParties: true,
            parties: [],
            government: [],
            crossbench: [],
            opposition: [],
            speaker: {
                enabled: false,
                partisan: true,
                party: null,
            },

            // Display settings:
            seatShape: "square",
            seatSpacing: 5,
            seatSize: 20,

            // Load and save:
            dataEntry: "",

            /**
             * Display properties:
             */

            WIDTH: 0,
            HEIGHT: 0,

            // Typology select options
            typologies: [
               { text: "Opposing", value: "opposing" }, 
               { text: "Semicircle", value: "semicircle" }, 
               { text: "Horseshoe", value: "horseshoe" }, 
               { text: "Circle", value: "circle" }, 
               { text: "Classroom", value: "classroom" }, 
            ],

            error: {
                title: "",
                message: "",
            },

            // menu control
            currentMenu: "general",
            menuItems: [
                { text: "General Settings", name: "general" },
                { text: "Parties and Groups", name: "parties-groups" },
                { text: "Drawing Settings", name: "drawing" },
                { text: "Load/Save Data", name: "load-save" },
            ],
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
             * Set up the app.
             */
            initialize: function() {
                WIDTH = document.getElementById('display').width;
                HEIGHT = document.getElementById('display').height;
                
                // Load from localStorage.
                let local = localStorage.getItem("data"); 
                if (local !== null) {
                    this.load(local);
                    this.dataEntry = local;

                    // Generate using the previous settings.
                    this.generate();
                }
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
             * Serialize the data to JSON
             */
            save: function() {

                let parties = [];
                for (let party of this.parties) {
                    
                    let group = "";
                    if (this.government.indexOf(party) !== -1) {
                        group = "government";
                    }
                    else if (this.opposition.indexOf(party) !== -1) {
                        group = "opposition";
                    }
                    else if (this.crossbench.indexOf(party) !== -1) {
                        group = "crossbench";
                    }

                    parties.push({
                        name: party.name,     
                        numberOfMembers: party.numberOfMembers,       
                        color: party.color,
                        group: group        
                    });
                }
                
                var obj = {
                    // General
                    jurisdictionName: this.jurisdictionName,
                    legislatureName: this.legislatureName,
                    typology: this.typology,
                    numberOfSeats: this.numberOfSeats,

                    // Parties
                    useParties: this.useParties,
                    parties: parties,
                    speaker: this.speaker,

                    // Drawing settings
                    seatShape: this.seatShape,
                    seatSize: this.seatSize,
                    seatSpacing: this.seatSpacing
                };

                let json = JSON.stringify(obj);

                localStorage.setItem("data", json);

                return json;
            },

            /**
             * Load settings 
             */
            load: function(data) {
                try {
                    var obj = JSON.parse(data);
                }
                catch (e) {
                    this.error.title = "Could not parse JSON";
                    this.error.message = e.message;
                    return;
                }

                // General
                this.jurisdictionName = obj.jurisdictionName;
                this.legislatureName = obj.legislatureName;
                this.typology = obj.typology;
                this.numberOfSeats = obj.numberOfSeats;

                // Parties
                this.useParties = obj.useParties;

                this.parties = [];
                this.government = [];
                this.crossbench = [];
                this.opposition = [];
                
                // Set the speaker before the parties because we're about to 
                // update the party reference.
                this.speaker = obj.speaker;

                for (let party of obj.parties) {
                    console.log(party, obj.parties);
                    party.collapsed = false;
                    
                    this.parties.push(party);
                    
                    // Set the speaker's party to refer to the correct object.
                    if (obj.speaker.party !== null) {
                        if (party.name === obj.speaker.party.name) {
                            this.speaker.party = party;
                        }
                    }
                    
                    // Add the party to the right parliamentary group, and then
                    // remove that property.
                    this[party.group].push(party);
                    delete party.group;
                }

                
                // Drawing settings
                this.seatShape = obj.seatShape;
                this.seatSize = obj.seatSize;
                this.seatSpacing = obj.seatSpacing;
            },

            /**
             * Clear the canvas in preparation for drawing.
             */
            clear: function() {
                project.activeLayer.removeChildren();

                // Clear error:
                this.error.title = "";
                this.error.message = "";
            },

            /**
             * Generate the legislature diagram.
             */
            generate: function() {
                // Clear the drawn data:
                this.clear();

                // Save the settings to localStorage.
                this.save();

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
                    seatShape: this.seatShape,

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
                if ((this.parties.length + 1) <= colors.length) {
                    color = colors[this.parties.length];
                } 

                let party = {
                    name: `Party ${this.parties.length + 1}`,
                    numberOfMembers: 0,
                    color: color,

                    // Display variables
                    collapsed: false
                }

                this.parties.push(party);
                this.government.push(party);
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
                this.government = this.government.filter(x => x !== party);
                this.crossbench = this.crossbench.filter(x => x !== party);
                this.opposition = this.opposition.filter(x => x !== party);
            },

            /**
             * Draw the legislature based on a props object.
             */
            drawLegislature: function(props) {

                switch (props.typology) {
                    case "opposing":
                        this.drawOpposing(props);
                        break;

                    case "semicircle":
                        this.drawSemicircle(props);
                        break;

                    case "horseshoe":
                        this.drawHorseshoe()
                        break;

                    case "circle":
                        this.drawCircle();
                        break;

                    default:
                        this.error.title = 
                            `Typology '${props.typology}' not recognized.`;
                        this.error.message = [ 
                            "Typology must be one of 'Opposing', 'Semicircle', ",
                            "'Horseshoe', 'Circle', or 'Classroom'"
                        ].join('');
                        return;
                }
            },

            /**
             * Draw seats arranged as two opposing benches.
             */
            drawOpposing: function(props) {
                
                // Determines the number of rows to columns 
                // (1 row : RATIO columns)
                const RATIO = 3.75; 

                // Get the total number of seats and the seat-color mapping 
                // for each parliamentary group / side of the chamber.
                function getSeatData(parties, speaker) {
                    let total = 0;
                    let seats = [];

                    for (let i = 0; i < parties.length; i++) {
                        total += parties[i].numberOfMembers;

                        var num = parties[i].numberOfMembers;
                        if (speaker.enabled && speaker.partisan && 
                            speaker.party == parties[i]
                        ) {
                            num--;
                            total--;
                        }
                        
                        seats.push({ 
                            num: num,
                            color: parties[i].color
                        });
                    }
                    return { total: total, seats: seats };
                }

                // Get the color of the next seat. We decrement the nunber of
                // seats in each parliamentary group each time. 
                function getNextColor(seatData) {
                    let i = 0;
                    while (seatData[i].num === 0) {
                        i++;
                    }

                    seatData[i].num--;
                    return seatData[i].color;
                }

                // Draw a bench.
                let that = this;
                function drawBench(
                    rows, cols, // Rows and cols of seats.
                    offsetX, offsetY, // Starting point for drawing.
                    total, seatsByParty, group // Bench variables.
                ) {
                    let numberSeatsDrawn = 0;
                    let currentColor = "black";

                    for (let i = 0; i < cols; i++) {
                        for (let j = 0; j < rows; j++) {                        
                            
                            if (numberSeatsDrawn >= total) break;

                            let center = new Point(
                                i * (that.seatSize + that.seatSpacing), 
                                j * (that.seatSize + that.seatSpacing)
                            );
                            center.x += offsetX;
                            center.y += offsetY;

                            console.log(center);

                            currentColor = getNextColor(seatsByParty);

                            group.push(
                                that.drawSeat(
                                    props.seatShape, 
                                    currentColor, 
                                    center, 
                                    that.seatSize
                                )
                            );

                            numberSeatsDrawn++;
                        }
                    }
                }

                // Determine which parties are on which bench:
                let rightBenchParties = this.government.concat([]);
                let leftBenchParties = this.opposition.concat(this.crossbench);

                if (rightBenchParties.length === 0 || 
                    leftBenchParties.length === 0
                ) {
                    this.error.title = "Bench cannot be empty";
                    this.error.message = 
                        ["Both benches in a legislature with the 'opposing' ",
                        "typology must have at least one member."].join('');
                    return;
                }   

                let rows, cols;
                let offsetX, offsetY;
                let seats = [];
                
                // Generate the left bench:
                {
                    let left = getSeatData(leftBenchParties, this.speaker);

                    // Calculate the number of rows and columns of seats for the 
                    // opposing benches.
                    rows = Math.ceil(Math.sqrt(left.total / RATIO));
                    cols = Math.ceil(left.total / rows);

                    offsetX = WIDTH / 2 - ((cols / 2) * (this.seatSize + this.seatSpacing));
                    offsetY = 40;

                    // Draw the left bench. Opposition MPs sit here.
                    drawBench(rows, cols, offsetX, offsetY, left.total, left.seats, seats);
                }

                // Generate the right bench:
                {
                    let right = getSeatData(rightBenchParties, this.speaker);

                    cols = Math.ceil(right.total / rows);

                    offsetY = offsetY + (rows + 3) * (this.seatSize + this.seatSpacing);

                    // Draw the right bench. Govt MPs sit here.
                    drawBench(rows, cols, offsetX, offsetY, right.total, right.seats, seats);
                }

                if (this.speaker.enabled) {
                    offsetX -= 2 * (this.seatSize + this.seatSpacing);
                    offsetY -= 2 * (this.seatSize + this.seatSpacing);
                    
                    let color;
                    if (this.speaker.partisan) {
                        if (this.speaker.party !== null) {
                            color = this.speaker.party.color;
                        }
                    }
                    else {
                        color = "#888888";
                    }

                    let centre = new Point(offsetX, offsetY);
                    seats.push(this.drawSeat(props.seatShape, color, centre, this.seatSize));
                }

                let group = new Group(seats);
            },

            /**
             * Draw seats arranged in a semicircle.
             */
            drawSemicircle: function(props) {
                
                // These are the total number of seats and the corresponding
                // number of rows required, where rows = index + 1.
                // These values taken from David Richfield's parliament diagram
                // generator.  
                let rowGuides = [3, 15, 33, 61, 95, 138, 189, 247, 313, 388, 
                    469, 559, 657, 762, 876, 997, 1126];

                let rows;
                for (rows = 0; rows < rowGuides.length; rows++) {
                    if (props.numberOfSeats < rowGuides[rows]) {
                        rows++;
                        break;
                    }
                }

                // Calculate radii of each row.
                let rowRadii = [];
                let inner = (this.seatSize + this.seatSpacing) * rows;
                for (let i = 0; i < rows; i++) {
                    rowRadii.push(inner + i * (this.seatSize + this.seatSpacing)); 
                }

                // Get the total row radii:
                let rowRadiiTotal = rowRadii.reduce((a, b) => a + b, 0);

                // Distribute seats to each row:
                let rowDist = [];
                for (let i = 0; i < rows; i++) {
                    rowDist.push(Math.round((rowRadii[i] / rowRadiiTotal) * props.numberOfSeats));
                }
 
                let center = new Point(WIDTH / 2, HEIGHT / 2 + rowRadii[0]);
                
                // Create a semicircular row of seats.
                // radius: radius of row
                // center: Point containing center
                // totalSeats: number of seats to draw
                // seats: seats array
                let that = this;
                function createRow(radius, center, totalSeats, seats) {
                    let circumference = Math.PI * radius;
                    
                    let angle = 180 / (totalSeats - 1);

                    for (let i = 0; i < totalSeats; i++) {

                        // Current angle:
                        let a = i * angle;
                        if (totalSeats == 1) {
                            a = 90;
                        }

                        // X and Y positions of each seat.
                        let x = center.x + radius * -Math.cos((a * Math.PI) / 180);
                        let y = center.y + radius * -Math.sin((a * Math.PI) / 180);
                        
                        seats.push({
                            x: x,
                            y: y,
                            angle: a
                        });
                    }
                }

                let seats = [];

                // Generate the seat objects.
                for (let i = 0; i < rows; i++) {
                    console.log("generating", rowDist[i], "seats");
                    createRow(rowRadii[i], center, rowDist[i], seats);
                }

                // Sort the seats by angle, so that we can color each seat
                // correctly.
                //@@TODO: bias sorting by row.
                seats.sort((a, b) => b.angle - a.angle);

                // Draw the seats:
                let seatShapes = [];
                let num = 0;
                for (let seat of seats) {
                    // Calculate the center and sizing vectors.
                    let c = new Point(seat.x, seat.y);
                    let r = new Point(this.seatSize / 2, this.seatSize / 2);
                    
                    let shape = new Path.Circle(c, r);
                    
                    // Set the color of the seats conditionally:
                    if (num < 60) {
                        shape.fillColor = "#FF00FF";
                    }
                    else {
                        shape.fillColor = "#FFFF00";
                    }
                    
                    seatShapes.push(shape);
                    
                    num++;
                }

                let group = new Group(seatShapes);
            },

            /**
             * Draw seats in two opposing benches, linked by a half-circle.
             */
            drawHorseshoe: function(props) {

            },

            /**
             * Draw seats arranged in a circle.
             */
            drawCircle: function(props) {

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
                
                switch(seatShape) {
                    case 'circle':
                        let radii = new Point(size / 2, size / 2);
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
                        this.error.title = `Shape '${seatShape}' not recognized.`;
                        this.error.message = this.error.title;
                }

                shape.fillColor = color;

                return shape;
            }
        }
    });

}