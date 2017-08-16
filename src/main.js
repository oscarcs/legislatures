window.onload = function() {
    window.app = new Vue({
        el: '#vue',
        data: {

        /**
         * Data:
         */

            //
            // General settings:
            //

            jurisdictionName: "",
            legislatureName: "",
            // The arrangment of seating in the legislature, based on
            // the typologies in XML's architecure book 'Parliament'.
            // Possible values:
            // "opposing": Opposing benches, e.g. United Kingdom.
            // "semicircle": Semicircular, e.g. European Union.
            // "horseshoe": e.g. New Zealand.
            // "circle": e.g. Jordan, Slovenia.
            // "classroom": Consecutive rows, e.g. China.
            typology: "opposing",
            // Number of members / seats in the legislature.
            numberOfSeats: 0,

            //
            // Parties and groups:
            //

            useParties: true,
            parties: [],
            // These three groups are used for the 'opposing' typology.
            government: [],
            crossbench: [],
            opposition: [],
            // This group is used for the 'semicircular' typology.
            partyOrdering: [],
            speaker: {
                enabled: false,
                partisan: true,
                party: null,
            },

            //
            // Display settings:
            //

            // Seat shape. XML's book uses squares, while Wikipedia uses
            // circles.
            // Possible values: "circle", "square"
            seatShape: "square",
            seatSpacing: 5,
            seatSize: 20,
            enforceConsistentSpacing: false,

            //
            // Load and save:
            //

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
                this.list.splice(event.newIndex, 0, this.list.splice(event.oldIndex, 1)[0]);
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

                    // Find the index of the party in the 

                    parties.push({
                        name: party.name,     
                        numberOfMembers: party.numberOfMembers,       
                        color: party.color,
                        
                        group: group,
                        ordering: this.partyOrdering.indexOf(party)
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
                    seatSpacing: this.seatSpacing,
                    enforceConsistentSpacing: this.enforceConsistentSpacing,                    
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
                
                // Set the speaker before the parties because we're about to update the party 
                // reference.
                this.speaker = obj.speaker;

                for (let party of obj.parties) {

                    party.collapsed = false;
                    
                    this.parties.push(party);
                    
                    // Set the speaker's party to refer to the correct object.
                    if (obj.speaker.party !== null) {
                        if (party.name === obj.speaker.party.name) {
                            this.speaker.party = party;
                        }
                    }
                    
                    // Add the party to the right parliamentary group, and then remove that 
                    // property.
                    this[party.group].push(party);
                    delete party.group;

                    // Add the party to the right index in the partyOrdering, and then remove that
                    // property.
                    if (party.ordering > -1) {
                        this.partyOrdering[party.ordering] = party;
                    }
                    else {
                        this.partyOrdering.push(party);
                    }
                    delete party.ordering;
                }
                
                // Drawing settings
                this.seatShape = obj.seatShape;
                this.seatSize = obj.seatSize;
                this.seatSpacing = obj.seatSpacing;
                this.enforceConsistentSpacing = obj.enforceConsistentSpacing;  
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

                // Make the seatTotal equal to the total of seats for each party.
                this.numberOfSeats = 0;
                for (party of this.parties) {
                    this.numberOfSeats += party.numberOfMembers;
                }

                // Clear the drawn data:
                this.clear();

                // Save the settings to localStorage.
                this.save();

                let group = this.drawLegislature();

                console.log('Generating...');
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
                
                // Add the party to the right ordering groups.
                this.government.push(party);
                this.partyOrdering.push(party);
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
                this.partyOrdering = this.partyOrdering.filter(x => x !== party);
            },

            /**
             * Get the total number of seats and the seat-color mapping for each parliamentary 
             * group / side of the chamber.
             */
            getSeatAllocations: function(parties, speaker) {
                let total = 0;
                let seats = [];

                for (let i = 0; i < parties.length; i++) {
                    total += parties[i].numberOfMembers;

                    var num = parties[i].numberOfMembers;
                    if (speaker.enabled && speaker.partisan && speaker.party == parties[i]) {
                        num--;
                        total--;
                    }
                    
                    seats.push({ 
                        num: num,
                        color: parties[i].color
                    });
                }
                return { total: total, seats: seats };
            },

            /**
             * Get the color of the next seat. We decrement the nunber of seats in each 
             * parliamentary group each time. 
             */
            getNextSeatAllocation: function(seatAllocations) {
                let i = 0;
                while (seatAllocations[i].num === 0) {
                    i++;
                }

                seatAllocations[i].num--;
                return seatAllocations[i].color;
            },

            /**
             * Draw the speaker.
             */
            drawSpeaker: function(x, y) {
                let color;
                if (this.speaker.partisan) {
                    if (this.speaker.party !== null) {
                        color = this.speaker.party.color;
                    }
                }
                else {
                    color = "#888888";
                }

                let centre = new Point(x, y);
                return this.drawSeat(this.seatShape, color, centre, this.seatSize);
            },

            /**
             * Draw the legislature.
             */
            drawLegislature: function() {

                switch (this.typology) {
                    case "opposing":
                        this.drawOpposing();
                        break;

                    case "semicircle":
                        this.drawSemicircle();
                        break;

                    case "horseshoe":
                        this.drawHorseshoe()
                        break;

                    case "circle":
                        this.drawCircle();
                        break;

                    default:
                        this.error.title = 
                            `Typology '${this.typology}' not recognized.`;
                        this.error.message = [ 
                            "Typology must be one of 'Opposing', 'Semicircle', 'Horseshoe', ",
                            "'Circle', or 'Classroom'"
                        ].join('');
                        return;
                }
            },

            /**
             * Draw seats arranged as two opposing benches.
             */
            drawOpposing: function() {
                
                // Determines the number of rows to columns (1 row : RATIO columns)
                const RATIO = 3.75; 

                let that = this;
                
                // Draw a bench.
                function drawBench(rows, cols, offsetX, offsetY, total, seatsByParty) {

                    let group = [];
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

                            currentColor = that.getNextSeatAllocation(seatsByParty);

                            group.push(
                                that.drawSeat(that.seatShape, currentColor, center, that.seatSize)
                            );

                            numberSeatsDrawn++;
                        }
                    }

                    return group;
                }

                // Determine which parties are on which bench:
                let rightBenchParties = this.government.concat([]);
                let leftBenchParties = this.opposition.concat(this.crossbench);

                if (rightBenchParties.length === 0 || leftBenchParties.length === 0) {
                    
                    this.error.title = "Bench cannot be empty";
                    this.error.message = 
                        ["Both benches in a legislature with the 'opposing' typology must have at ",
                        "least one member."].join('');
                    return;
                }   

                let rows, cols;
                let offsetX, offsetY;
                let seatShapes = [];
                
                let left = that.getSeatAllocations(leftBenchParties, that.speaker);
                let right = that.getSeatAllocations(rightBenchParties, that.speaker);                

                // The number of rows should be based on the largest bench:
                if (left.total > right.total) {
                    rows = Math.ceil(Math.sqrt(left.total / RATIO));
                }
                else {
                    rows = Math.ceil(Math.sqrt(right.total / RATIO));
                }

                leftCols = Math.ceil(left.total / rows);                
                rightCols = Math.ceil(right.total / rows);                

                if (leftCols > rightCols) {
                    offsetX = WIDTH / 2 - ((leftCols / 2) * (that.seatSize + that.seatSpacing));                    
                }
                else {
                    offsetX = WIDTH / 2 - ((rightCols / 2) * (that.seatSize + that.seatSpacing));                    
                }
                
                // Draw the left bench. Opposition MPs sit here.
                offsetY = 40;
                seatShapes = seatShapes.concat(
                    drawBench(rows, leftCols, offsetX, offsetY, left.total, left.seats)
                );
                
                // Draw the right bench. Govt MPs sit here.
                offsetY += (rows + 3) * (that.seatSize + that.seatSpacing);
                seatShapes = seatShapes.concat(
                    drawBench(rows, rightCols, offsetX, offsetY, right.total, right.seats)
                );

                if (this.speaker.enabled) {
                    offsetX -= 2 * (this.seatSize + this.seatSpacing);
                    offsetY -= 2 * (this.seatSize + this.seatSpacing);
                    this.drawSpeaker(offsetX, offsetY);
                }

                let group = new Group(seatShapes);
            },

            /**
             * Draw seats arranged in a semicircle.
             */
            drawSemicircle: function() {

                let seatData = this.getSeatAllocations(this.partyOrdering, this.speaker);                 

                // These are the total number of seats and the corresponding number of rows 
                // required, where rows = index + 1.
                // These values taken from David Richfield's parliament diagram generator.  
                let rowGuides = [3, 15, 33, 61, 95, 138, 189, 247, 313, 388, 469, 559, 657, 762, 
                    876, 997, 1126];

                let rows;
                for (rows = 0; rows < rowGuides.length; rows++) {
                    if (seatData.total < rowGuides[rows]) {
                        break;
                    }
                }
                // Ensure we have at least 1 row.
                rows = Math.max(1, rows);


                // The total length of circumference we will need for all the seats.
                let total_c = seatData.total * (this.seatSize + this.seatSpacing);
                
                // The total radius, based on the total circumference:
                let total_r = total_c / Math.PI;

                // Calculate the base:
                // (Derivation for this is based on an arithmetic series.)
                let base = 0.5 * (((2 * total_r) / rows) - rows * (this.seatSize + this.seatSpacing));

                // Calculate radii of each row:
                let rowRadii = [];
                for (let i = 0; i < rows; i++) {
                    rowRadii.push(base + i * (this.seatSize + this.seatSpacing)); 
                }

                // Get the total row radii:
                let rowRadiiTotal = rowRadii.reduce((a, b) => a + b, 0);
                
                // Distribute seats to each row:
                let rowDist = [];
                let rowTotal = 0;
                for (let i = 0; i < rows; i++) {
                    rowDist.push(
                        Math.round((rowRadii[i] / rowRadiiTotal) * seatData.total)
                    );
                    rowTotal += rowDist[i];
                }
 
                // Adjust outer row to ensure the correct number of seats are drawn.
                rowDist[rowDist.length-1] += seatData.total - rowTotal;

                let center = new Point(WIDTH / 2, HEIGHT / 2 + rowRadii[0]);
                
                // Create a semicircular row of seats.
                // radius: radius of row
                // center: Point containing center
                // totalSeats: number of seats to draw
                // seats: seats array
                let that = this;
                function createRow(radius, center, totalSeats) {
                    
                    let seats = [];

                    let circumference = Math.PI * radius;
                    let angle = 0;
                    let totalAngle = 0; 
                    let startAngle = 0; 

                    // This option ensures that each row has identical spacing 
                    // between seats.
                    // This will produce 'rough edges', which may be a desired 
                    // effect.
                    if (that.enforceConsistentSpacing) {
                        angle = 180 * (that.seatSize + that.seatSpacing) / circumference;
                        totalAngle = (totalSeats - 1) * angle;
                        startAngle = (180 - totalAngle) / 2;
                    }
                    // Otherwise, Use seat spacings that are roughly similar, 
                    // but not identical. 
                    else {
                        angle = 180 / (totalSeats - 1);
                    }

                    for (let i = 0; i < totalSeats; i++) {

                        // Current angle:
                        let a = i * angle + startAngle;
                        if (totalSeats == 1) {
                            a = 90;
                        }

                        // calculate the X and Y positions of each seat
                        let x = center.x + radius * -Math.cos((a * Math.PI) / 180);
                        let y = center.y + radius * -Math.sin((a * Math.PI) / 180);

                        seats.push({ x: x, y: y, angle: a });
                    }

                    return seats;
                }

                // Generate the seat objects.
                let seats = [];
                for (let i = 0; i < rows; i++) {
                    seats = seats.concat(createRow(rowRadii[i], center, rowDist[i]));
                }

                // Sort the seats by angle, so that we can color each seat correctly.
                //@@TODO: bias sorting by row?
                seats.sort((a, b) => a.angle - b.angle);
                
                console.log("number of seats", this.numberOfSeats);
                console.log("actual number of seats", seats.length);

                // Draw each seat:
                let seatShapes = [];
                for (let seat of seats) {
                    let shape;
                    let position = new Point(seat.x, seat.y)

                    let color = this.getNextSeatAllocation(seatData.seats);

                    shape = this.drawSeat(this.seatShape, color, position, this.seatSize);
                    shape.rotate(seat.angle, position);
                    seatShapes.push(shape);
                }

                if (this.speaker.enabled) {
                    let x = center.x
                    let y = center.y + this.seatSize + this.seatSpacing;
                    this.drawSpeaker(x, y);
                }

                let group = new Group(seatShapes);
            },

            /**
             * Draw seats in two opposing benches, linked by a half-circle.
             */
            drawHorseshoe: function() {

            },

            /**
             * Draw seats arranged in a circle.
             */
            drawCircle: function() {

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