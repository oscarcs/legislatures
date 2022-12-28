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
            // The arrangment of seating in the legislature, based on the typologies in XML's 
            // architecure book 'Parliament'.
            // Possible values:
            //  "opposing": Opposing benches, e.g. United Kingdom.
            //  "semicircle": Semicircular, e.g. European Union.
            //  "horseshoe": e.g. New Zealand.
            //  "circle": e.g. Jordan, Slovenia.
            //  "classroom": Consecutive rows, e.g. China.
            typology: "opposing",
            theta: 180,
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

            // Seat shape. XML's book uses squares, while Wikipedia uses circles.
            // Possible values: "circle", "square"
            seatShape: "square",
            seatSpacing: 5,
            seatSize: 20,
            // Whether or not to use equal-sized benches in the 'opposing' typology.
            equalBenches: false,
            // Number of columns to use in 'classroom' typology.
            classroomColumns: 0, 
            // Ratio of benches to crossbenches in 'horseshoe' typology.
            horseshoeRatio: 0.4,

        /**
         * Display properties:
         */
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

            dataEntry: "",            
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
                WIDTH = parseInt(window.getComputedStyle(document.getElementById('display')).width);
                HEIGHT = parseInt(window.getComputedStyle(document.getElementById('display')).height);
                
                // Load from localStorage.
                let local = localStorage.getItem("data"); 
                
                if (local === null) {
                    local = "{\"jurisdictionName\":\"New Zealand\",\"legislatureName\":\"Parliament\",\"typology\":\"horseshoe\",\"theta\":180,\"numberOfSeats\":120,\"useParties\":true,\"parties\":[{\"name\":\"National\",\"numberOfMembers\":34,\"color\":\"#00529F\",\"group\":\"government\",\"ordering\":0},{\"name\":\"Labour\",\"numberOfMembers\":64,\"color\":\"#D82A20\",\"group\":\"opposition\",\"ordering\":4},{\"name\":\"Green\",\"numberOfMembers\":10,\"color\":\"#098137\",\"group\":\"government\",\"ordering\":3},{\"name\":\"ACT\",\"numberOfMembers\":10,\"color\":\"#FDE401\",\"group\":\"government\",\"ordering\":1},{\"name\":\"Te Pāti Māori\",\"numberOfMembers\":2,\"color\":\"#54000f\",\"group\":\"government\",\"ordering\":2}],\"speaker\":{\"enabled\":false,\"partisan\":true,\"party\":{\"name\":\"National\",\"numberOfMembers\":34,\"color\":\"#00529F\",\"collapsed\":false}},\"seatShape\":\"circle\",\"seatSize\":20,\"seatSpacing\":5,\"equalBenches\":false,\"classroomColumns\":0,\"horseshoeRatio\":0.52}";
                }

                this.load(local);
                this.dataEntry = local;

                // Generate using the previous settings.
                this.generate();
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
                    theta: this.theta,
                    numberOfSeats: this.numberOfSeats,

                    // Parties
                    useParties: this.useParties,
                    parties: parties,
                    speaker: this.speaker,

                    // Drawing settings
                    seatShape: this.seatShape,
                    seatSize: this.seatSize,
                    seatSpacing: this.seatSpacing,
                    equalBenches: this.equalBenches,
                    classroomColumns: this.classroomColumns,                                 
                    horseshoeRatio: this.horseshoeRatio,                                 
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
                this.theta = obj.theta;
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
                this.equalBenches = obj.equalBenches;  
                this.classroomColumns = obj.classroomColumns;
                this.horseshoeRatio = obj.horseshoeRatio;
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
                if (this.useParties) {
                    this.numberOfSeats = 0;
                    for (party of this.parties) {
                        this.numberOfSeats += party.numberOfMembers;
                    }
                }
                else {
                    this.speaker.partisan = false;
                }

                if (this.horseshoeRatio < 0) {
                    this.horseshoeRatio = 0;
                }
                else if (this.horseshoeRatio > 1) {
                    this.horseshoeRatio = 1;
                }

                // Clear the drawn data:
                this.clear();

                // Save the settings to localStorage.
                this.save();

                let group = this.drawLegislature();

                console.log('Generating...');
            },

            exportSVG: function() {
                return 'data:application/octet-stream,' + encodeURIComponent(
                    paper.project.exportSVG({asString:true}
                ));
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
                for (alloc of seatAllocations) {
                    if (alloc.num !== 0) break; 
                    i++;
                }

                if (seatAllocations[i] == null) return null;

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
                    color = "#999999";
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
                        this.drawCircle(180);
                        break;

                    case "circle":
                        this.drawCircle(this.theta);
                        break;

                    case "horseshoe":
                        this.drawHorseshoe(this.horseshoeRatio);
                        break;

                    case "classroom":
                        this.drawClassroom();
                        break;

                    default:
                        this.error.title = 
                            `Typology '${this.typology}' not recognized.`;
                        this.error.message = [ 
                            "Typology must be one of 'opposing', 'semicircle', 'horseshoe', ",
                            "'circle', or 'classroom'"
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
                // rows: The number of horizontal rows for this bench.
                // cols: The number of vertical columns for this bench.
                // x: x position
                // y: y position
                // seatsByParty: the seat data for this bench.
                function drawBench(rows, cols, x, y, seatsByParty) {

                    let group = [];
                    let numberSeatsDrawn = 0;
                    let currentColor = "black";

                    for (let i = 0; i < cols; i++) {
                        for (let j = 0; j < rows; j++) {                        
                            
                            let center = new Point(
                                i * (that.seatSize + that.seatSpacing), 
                                j * (that.seatSize + that.seatSpacing)
                            );  
                            center.x += x;
                            center.y += y;

                            currentColor = that.getNextSeatAllocation(seatsByParty);
                            if (currentColor === null) break;

                            group.push(
                                that.drawSeat(that.seatShape, currentColor, center, that.seatSize)
                            );

                            numberSeatsDrawn++;
                        }
                    }

                    return group;
                }

                let rightBenchParties, leftBenchParties, left, right;

                // Determine which parties are on which bench:
                if (this.useParties) {
                    rightBenchParties = this.government.concat([]);
                    leftBenchParties = this.opposition.concat(this.crossbench);

                    if (rightBenchParties.length === 0 || leftBenchParties.length === 0) {                        
                        this.error.title = "Bench cannot be empty";
                        this.error.message = 
                            ["Both benches in a legislature with the 'opposing' typology must have at ",
                            "least one member."].join('');
                        return;
                    }   

                    // Get the seat allocations for each group of parties.
                    left = this.getSeatAllocations(leftBenchParties, this.speaker);
                    right = this.getSeatAllocations(rightBenchParties, this.speaker);
                }
                else {
                    left = this.getSeatAllocations([{
                        numberOfMembers: Math.floor(this.numberOfSeats / 2),
                        color: "#999999"
                    }], this.speaker);
                    right = this.getSeatAllocations([{
                        numberOfMembers: Math.ceil(this.numberOfSeats / 2),
                        color: "#999999"
                    }], this.speaker);
                }

                let rows, cols;
                let offsetX, offsetY;
                let seatShapes = [];
                let equalBenchLeft, equalBenchRight;
                
                if (this.equalBenches) {

                    let largerBench = Math.ceil(this.numberOfSeats / 2);
                    let smallerBench = Math.floor(this.numberOfSeats / 2);
                    equalBenchLeft = left.total > right.total ? largerBench : smallerBench;
                    equalBenchRight = left.total < right.total ? largerBench : smallerBench;

                    rows = Math.ceil(Math.sqrt(largerBench / RATIO));                    

                    leftCols = Math.ceil(equalBenchLeft / rows);
                    rightCols = Math.ceil(equalBenchRight / rows);

                    console.log(largerBench, smallerBench, equalBenchLeft, equalBenchRight, rows);
                }
                else {
                    rows = Math.ceil(Math.sqrt(Math.max(left.total, right.total) / RATIO));

                    leftCols = Math.ceil(left.total / rows);                
                    rightCols = Math.ceil(right.total / rows);                
                }

                let largerCols = Math.max(leftCols, rightCols);
                offsetX = WIDTH / 2 - ((largerCols / 2) * (that.seatSize + that.seatSpacing));                    

                // Draw the left bench. Opposition MPs sit here.
                function drawLeftBench() {
                    offsetY = 40;
                    
                    let total = that.equalBenches ? equalBenchLeft : left.total;
                    seatShapes = seatShapes.concat(
                        drawBench(rows, leftCols, offsetX, offsetY, left.seats)
                    );
                }

                // Draw the right bench. Govt MPs sit here.
                function drawRightBench() {
                    offsetY = 40 + (rows + 3) * (that.seatSize + that.seatSpacing);

                    let total = that.equalBenches ? equalBenchRight : right.total;
                    seatShapes = seatShapes.concat(
                        drawBench(rows, rightCols, offsetX, offsetY, right.seats)
                    );
                }

                // Draw the left bench before the right bench, in case we want to 'overflow'
                // some of the seats to the right bench. This case is far less common, because
                // in most legislatures the right bench should be a majority.
                if (left.total > right.total) {
                    drawLeftBench();
                    if (this.equalBenches && left.seats[left.seats.length - 1] !== 0) {
                        right.seats = right.seats.concat(left.seats);
                        right.seats = right.seats.filter(x => x.num !== 0);
                    }
                    drawRightBench();
                }
                // Draw the right bench before the left bench in case we want to 'overflow'
                // some of the seats to the left bench.
                else {
                    drawRightBench();
                    if (this.equalBenches && right.seats[right.seats.length - 1] !== 0) {
                        left.seats = left.seats.concat(right.seats);
                        left.seats = left.seats.filter(x => x.num !== 0);
                    }
                    drawLeftBench();
                }

                // Draw the speaker.
                if (this.speaker.enabled) {
                    offsetX -= 2 * (that.seatSize + that.seatSpacing);
                    offsetY = 40 + (rows + 1) * (that.seatSize + that.seatSpacing)
                    this.drawSpeaker(offsetX, offsetY);
                }
            },

            /**
             * Draw seats arranged in a circle.
             * theta: the angle over which the seats should be arranged.
             * seatData: the coloring data and total seats.
             * seatsOnly: return the seat data only (don't draw the seats).
             * overrideOffset: optionally override the position of the diagram.
             */
            drawCircle: function(theta, seatData, seatsOnly, overrideOffset) {

                if (typeof seatData === 'undefined') {
                    if (this.useParties) {
                        seatData = this.getSeatAllocations(this.partyOrdering, this.speaker);
                    }
                    else {
                        seatData = this.getSeatAllocations([{
                            numberOfMembers: this.numberOfSeats,
                            color: "#999999"
                        }], this.speaker);
                    }
                }

                // These are the total number of seats and the corresponding number of rings/rows 
                // required, where rings = index + 1.
                // These values taken from David Richfield's parliament diagram generator. 
                // They appear to be pretty arbitrary, so we could replace them with a function. 
                let ringGuides = [3, 15, 33, 61, 95, 138, 189, 247, 313, 388, 469, 559, 657, 762, 
                    876, 997, 1126];

                // Adjust the ring guides based on theta.
                for (let i = 0; i < ringGuides.length; i++) {
                    ringGuides[i] = (theta / 180) * ringGuides[i]; 
                }

                let rings;
                for (rings = 0; rings < ringGuides.length; rings++) {
                    if (seatData.total < ringGuides[rings]) {
                        break;
                    }
                }
                // Ensure we have at least 1 row.
                rings = Math.max(1, rings);

                // The total length of circumference we will need for all the seats.
                let total_c = seatData.total * (this.seatSize + this.seatSpacing);
                
                // The total radius, based on the total circumference:
                let total_r = total_c / ((theta / 180) * Math.PI);

                // Calculate the base:
                // (Derivation for this is based on an arithmetic series.)
                let inner = 
                    0.5 * (((2 * total_r) / rings) - rings * (this.seatSize + this.seatSpacing));

                // Calculate radii of each row:
                let radii = [];
                for (let i = 0; i < rings; i++) {
                    radii.push(inner + i * (this.seatSize + this.seatSpacing)); 
                }

                // Get the total radii of all of the rings:
                let radiiTotal = radii.reduce((a, b) => a + b, 0);
                
                // Distribute seats to each ring:
                let distribution = [];
                let distTotal = 0;
                for (let i = 0; i < rings; i++) {
                    distribution.push(
                        Math.round((radii[i] / radiiTotal) * seatData.total)
                    );
                    distTotal += distribution[i];
                }
    
                // Adjust outer ring to ensure the correct number of seats are drawn using the
                // difference between the seatData and the distribution total.
                distribution[distribution.length - 1] += seatData.total - distTotal;
                
                let center = new Point(WIDTH / 2, HEIGHT / 2 + radii[0]);
                
                // Create a semicircular ring of seats.
                // radius: radius of ring
                // center: Point containing center
                // totalSeats: number of seats to draw
                // seats: seats array
                let that = this;
                function createRing(radius, center, totalSeats) {
                    
                    let seats = [];

                    let circumference = (180 / theta) * Math.PI * radius;
                    let angle = 0;
                    let totalAngle = 0; 
                    let startAngle = 0; 

                    angle = theta / (totalSeats - 1);
                    startAngle = (180 - theta) / 2;

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

                // Optionally override the center point.
                let pt = (typeof overrideOffset === 'undefined') ? center : overrideOffset;
                
                // Generate the seat objects.
                let seats = [];
                for (let i = 0; i < rings; i++) {
                    seats = seats.concat(createRing(radii[i], pt, distribution[i]));
                }

                // Sort the seats by angle, so that we can color each seat correctly.
                //@@TODO: bias sorting by row somehow?
                seats.sort((a, b) => a.angle - b.angle);

                // If 'seatsOnly' is set, return the locations of seats instead of drawing them.
                if (typeof seatsOnly !== 'undefined' && seatsOnly === true) {    
                    return {
                        seats: seats,
                        rings: rings,
                        inner: inner
                    };
                }
                // Otherwise, draw each seat:
                else {
                    let seatShapes = [];
                    for (let seat of seats) {

                        let position = new Point(seat.x, seat.y);
                        let color = this.getNextSeatAllocation(seatData.seats);

                        shape = this.drawSeat(
                            this.seatShape,
                            color,
                            position,
                            this.seatSize
                        );
                        shape.rotate(seat.angle, position);
                        seatShapes.push(shape);
                    }

                    if (this.speaker.enabled) {
                        let x = center.x
                        let y = center.y;
                        this.drawSpeaker(x, y);
                    }
                }
            },

            /**
             * Draw a horseshoe-type diagram. Combines 'opposing' and 'semicircle'.
             * ratio: ratio of the seats to be taken by the semicircular part.
             */
            drawHorseshoe: function(ratio) {
                if (typeof ratio === 'undefined') {
                    ratio = 0.4;
                }

                let that = this;
                let seats = [];

                // Divide the seat data:
                let seatData;

                let rings = 0; // Number of 'rows', inside to outside.
                let rows = 0; // Number of actual rows from top to bottom.
                let inner = 0; // Radius of inner 'ring' of half-circle.
                let center = new Point(WIDTH / 2, HEIGHT / 2 - 60);

                // The crossbench (semicircular) is opposite the speaker.
                function createCrossbench() {

                    // Calculate the number of seats in the half circle, such that the arrangement
                    // of the two benches is the same.
                    let total = 2 * Math.floor((1 - ratio) * that.numberOfSeats / 2);
                    total = that.numberOfSeats - total;
                    //@@TODO: Make this cleaner
                    if (that.speaker.enabled && that.speaker.partisan) {
                        total--;
                    }

                    // Dummy up some seat data
                    seatData = that.getSeatAllocations([{
                        numberOfMembers: total,
                        color: "#999999"
                    }], that.speaker);

                    // Draw the half-circle:
                    let circle = that.drawCircle(180, seatData, true, center);
                    rings = circle.rings;
                    inner = circle.inner;
                    return circle.seats;
                }

                function createBench(sortOrder, offsetX, offsetY, total) {
                    let bench = [];

                    // Dummy up some seat data
                    seatData = that.getSeatAllocations([{
                        numberOfMembers: Math.floor((1 - ratio) * that.numberOfSeats / 2),
                        color: "#999999"
                    }], that.speaker);

                    // Calculate the requisite number of rows:
                    rows = Math.ceil(seatData.total / rings);

                    // The number of rings serves as the number of columns for each bench.
                    for (let i = 0; i < rings; i++) {
                        for (let j = 0; j < rows; j++) {

                            let x = i * (that.seatSize + that.seatSpacing);
                            let y = j * (that.seatSize + that.seatSpacing);

                            bench.push({
                                x: x + offsetX,
                                y: y + offsetY,
                                angle: 0
                            });
                        }
                    }

                    // Left
                    if (sortOrder === 'asc') {
                        // Sort for array trimming
                        bench.sort((a, b) => a.y === b.y ? (a.x - b.x) : (b.y - a.y));
                        bench = bench.slice(bench.length - seatData.total);
                        
                        // Sort for seat allocation
                        bench.sort((a, b) => a.y === b.y ? (a.x - b.x) : (b.y - a.y));
                    }
                    // Right
                    else if (sortOrder === 'desc') {
                        // Sort for array trimming
                        bench.sort((a, b) => a.y === b.y ? (b.x - a.x) : (b.y - a.y));
                        bench = bench.slice(bench.length - seatData.total);

                        // Sort for seat allocation
                        bench.sort((a, b) => a.y === b.y ? (b.x - a.x) : (a.y - b.y));
                    }

                    return bench;
                }

                let offsetX, offsetY;
                // crossbenches
                let crossbench = createCrossbench();
                
                // left / govt bench
                offsetX = center.x - inner - (rings - 1) * (this.seatSize + this.seatSpacing);
                offsetY = center.y + this.seatSize + this.seatSpacing;
                let left = createBench('asc', offsetX, offsetY);

                // right / opposition bench
                offsetX = center.x + inner;
                offsetY = center.y + this.seatSize + this.seatSpacing;
                let right = createBench('desc', offsetX, offsetY);

                // Add the seats in the correct order
                seats = seats.concat(left);
                seats = seats.concat(crossbench);
                seats = seats.concat(right);

                if (this.useParties) {
                    seatData = this.getSeatAllocations(this.partyOrdering, this.speaker);
                }
                else {
                    seatData = this.getSeatAllocations([{
                        numberOfMembers: this.numberOfSeats,
                        color: "#999999"
                    }], this.speaker);
                }

                // Draw each seat:
                let seatShapes = [];
                for (let seat of seats) {

                    let position = new Point(seat.x, seat.y);
                    let color = this.getNextSeatAllocation(seatData.seats);

                    shape = this.drawSeat(
                        this.seatShape,
                        color,
                        position,
                        this.seatSize
                    );
                    shape.rotate(seat.angle, position);
                    seatShapes.push(shape);
                }

                // Draw the speaker centred 'in front' of the assembly.
                if (this.speaker.enabled) {
                    let x = center.x;
                    let y = center.y + rows * (this.seatSize + this.seatSpacing);
                    this.drawSpeaker(x, y);
                }
             },

            /**
             * Draw seats arranged in a block.
             */
            drawClassroom: function() {
                if (typeof this.classroomColumns === 'undefined' || 
                    this.classroomColumns <= 0 || this.classroomColumns === null
                ) {
                    this.error.title = 
                        "Must set valid number of columns for the 'Classroom' typology.";
                    this.error.message = "Should have a nonzero number of rows and columns.";
                    return;
                }

                let seatData;                
                if (this.useParties) {
                    seatData = this.getSeatAllocations(this.partyOrdering, this.speaker);
                }
                else {
                    seatData = this.getSeatAllocations([{
                        numberOfMembers: this.numberOfSeats,
                        color: "#999999"
                    }], this.speaker);
                }  

                // We can't automatically determine an arrangement (the number of seats might be
                // prime), so we just put the rest of the seats in a overflow row.
                let rows = Math.ceil(this.numberOfSeats / this.classroomColumns);

                // Calculate the offsets to centre the diagram.
                let offsetX = WIDTH / 2 - 
                    (this.classroomColumns * (this.seatSize + this.seatSpacing)) / 2;
                let offsetY = HEIGHT / 2 - 
                    (rows * (this.seatSize + this.seatSpacing)) / 2;

                
                // Used for determining the overflow row.
                let diff = (rows * this.classroomColumns - seatData.total) / 2; 
                
                // Draw back-to-front and left-to-right 
                for (let i = 0; i < this.classroomColumns; i++) {
                    for (let j = 0; j < rows; j++) {
                        
                        // Make the top row into an 'overflow' row.
                        if (j === 0 && (i < diff || i >= this.classroomColumns - diff)) {
                            continue;
                        } 

                        let x = i * (this.seatSize + this.seatSpacing) + offsetX;
                        let y = j * (this.seatSize + this.seatSpacing) + offsetY;

                        // Centre-align the overflow, if there is one:
                        if (j === 0 && diff % 1 === 0.5) {
                            x -= (this.seatSize + this.seatSpacing) / 2;
                        }
                        
                        // Draw the seat directly.
                        let p = new Point(x, y);
                        let color = this.getNextSeatAllocation(seatData.seats);
                        this.drawSeat(this.seatShape, color, p, this.seatSize);
                    }
                }

                // Draw the speaker centred 'in front' of the assembly.
                if (this.speaker.enabled) {
                    let x = (this.classroomColumns / 2 - 0.5) * (this.seatSize + this.seatSpacing);
                    let y = (rows + 2) * (this.seatSize + this.seatSpacing);
                    this.drawSpeaker(x + offsetX, y + offsetY);
                }
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