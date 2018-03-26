var playing = false;

function ditmonreset (id) {
    playing = false;

    var svg = d3.select ('#' + id);
    svg.selectAll('*').remove ();

    d3.select ('#' + id + 'Btn')
        .text ('Play')
        .attr ('onclick', 'ditmonplay ("' + id + '")');
}

function ditmonplay (id) {
    d3.select ('#' + id + 'Btn')
        .text ('Reset')
        .attr ('onclick', 'ditmonreset ("' + id + '")');

    playing = true;

    record = records[id].slice ();

    var svg = d3.select ('#' + id);
    var width = svg.style('width').replace ('px', '');
    var height = svg.style('height').replace ('px', '');

    svg.append ("defs")
        .selectAll ("marker")
        .data (["subscribe", "unsubscribe", "publish", "comm"])
        .enter ()
        .append ("marker")
        .attr ("id", function (d) { return d })
        .attr ("viewBox", "0 -5 10 10")
        .attr ("refX", 20)
        .attr ("refY", -1.5)
        .attr ("markerWidth", 6)
        .attr ("markerHeight", 6)
        .attr ("orient", "auto")
        .append ("path")
        .attr ("d", "M 0 -5 L 10 0 L 0 5");

    var nodes = {};
    var links = {};

    var force = d3.layout.force ()
        .size ([width, height])
        .on ("tick", tick);

    var L = svg.append("g").selectAll (".link");
    var N = svg.append("g").selectAll (".node");
    
    function updateGraph () {
        L = L.data (d3.values (links));
        L.enter ()
            .append ("path")
            .attr ("class", linkStatus)
            .attr ("marker-end", linkMarker);
        L.exit ()
            .remove ();

        N = N.data (d3.values (nodes));
        N.enter ()
            .append ("circle")
            .attr ("r", 12)
            .attr ("class", nodeStatus)
            .call (force.drag);
        N.exit ()
            .remove ();

        force.links (d3.values (links))
            .nodes (d3.values (nodes))
            .start ();
    }

    function tick () {
        L.attr ("d", linkArc)
            .attr ("class", linkStatus)
            .attr ("marker-end", linkMarker);

        N.attr ("transform", nodePosition)
            .attr ("class", nodeStatus);
    }

    function linkArc (d) {
        var dx = d.target.x - d.source.x;
        var dy = d.target.y - d.source.y;
        var dr = Math.sqrt (dx * dx + dy * dy);
        
        var source = "M" + d.source.x + " " + d.source.y;
        var arc = "A" + dr + " " + dr + " 0 0 1 ";
        var target = d.target.x + " " + d.target.y;

        return source + arc + target;
    }

    function linkStatus (d) { return "link " + d.status }

    function linkMarker (d) { return "url(#" + d.status + ")" }

    function nodePosition (d) { return "translate(" + d.x + "," + d.y + ")" }

    function nodeStatus (d) { return "node " + d.status }

    // The Sequencer

    nextEvent ();

    function nextEvent () {
        if (record.length > 0 && playing) {
            var thisEvent = record.shift ();
            var thisEventTime = thisEvent[0];
            if (record.length > 0) {
                var nextEventTime = record[0][0];
                setTimeout (nextEvent, nextEventTime - thisEventTime);
            }
            playEvent (thisEvent[1], thisEvent[2]);
        }
        else
            playing = false;
    }

    function playEvent (type, data) {
        switch (type) {

        case 'config':
            force.charge (0 - data.charge)
                .linkDistance (data.distance);
            break;

        case 'resume':
            updateGraph ();
            break;

        case 'start':
            var cls = data[0];
            var src = data[1];
            if (cls === 'node')
                nodes[src] = {name : src, status :  'subscribe'};
            else {
                var tgt = data[2];
                links[src + '-' + tgt] = {
                    source : nodes[src],
                    target : nodes[tgt],
                    status : cls
                };
                nodes[src].status = cls;
            }
            updateGraph ();
            break;

        case 'stop':
            var cls = data[0];
            var src = data[1];
            if (cls == 'node')
                delete nodes[src];
            else {
                var tgt = data[2];
                delete links[src + '-' + tgt];
                nodes[src].status = 'subscribe';
            }
            updateGraph ();
            break;

        case 'update':
            var cls = data[0];
            var src = data[1];
            if (data.length === 2)
                nodes[src].status = cls;
            else {
                var tgt = data[2];
                links[src+'-'+tgt].status = cls;
            }
            updateGraph ();
            break;
        }
    }
}
